import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdmin } from "@/lib/rbac";
import { initializeFirebase, getAdminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { findStaleOperations, cleanupOldOperations } from "@/lib/transactionCoordinator";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reconciliation-job
 *
 * Background reconciliation job that:
 * 1. Finds stale pending_operations (stuck in_progress or compensating)
 * 2. Attempts to repair orphaned Auth-only accounts
 * 3. Reconciles Firestore ↔ MongoDB discrepancies
 * 4. Cleans up old completed operations
 *
 * Should be triggered by a cron job or manual admin action.
 */
export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireAdmin(request);

  initializeFirebase();
  const db = admin.firestore();
  const mongoDB = await connectDb();

  const results = {
    staleOperationsReviewed: 0,
    orphanedAuthDeleted: 0,
    firestoreToMongoReconciled: 0,
    mongoToFirestoreReconciled: 0,
    errors: [],
  };

  // 1. Find and handle stale pending operations
  try {
    const staleOps = await findStaleOperations(300000);
    results.staleOperationsReviewed = staleOps.length;

    for (const op of staleOps) {
      logger.info(`[reconciliation-job] Processing stale operation: ${op.operationId}`, {
        operationType: op.operationType,
        uid: op.uid,
        status: op.status,
      });

      // If operation failed and was fully compensated, mark as resolved
      if (op.status === "compensating" && op.fullyCompensated) {
        const mongoDB = await connectDb();
        await mongoDB.collection("pending_operations").updateOne(
          { operationId: op.operationId },
          { $set: { status: "resolved_by_reconciliation", updatedAt: new Date() } }
        );
      }
    }
  } catch (err) {
    results.errors.push(`Stale operations review failed: ${err.message}`);
  }

  // 2. Find orphaned Firebase Auth accounts (exist in Auth but not in any DB)
  try {
    const authUsers = [];
    // List users from Firestore to compare against Auth
    const firestoreUsers = await db.collection("users").limit(1000).get();
    const firestoreUids = new Set();
    firestoreUsers.docs.forEach((doc) => {
      firestoreUids.add(doc.id);
    });

    // Check MongoDB users
    const mongoUsers = await mongoDB.collection("users").find({}).limit(1000).toArray();
    const mongoUids = new Set();
    mongoUsers.forEach((u) => {
      if (u.firebaseUid) mongoUids.add(u.firebaseUid);
    });

    // Find UIDs that are in Firestore but not MongoDB → reconcile
    for (const uid of firestoreUids) {
      if (!mongoUids.has(uid)) {
        const firestoreDoc = await db.collection("users").doc(uid).get();
        const firestoreData = firestoreDoc.data();
        if (!firestoreData) continue;

        const now = new Date().toISOString();
        await mongoDB.collection("users").updateOne(
          { firebaseUid: uid },
          {
            $set: {
              firebaseUid: uid,
              email: firestoreData.email || "",
              name: firestoreData.fullName || "",
              fullName: firestoreData.fullName || "",
              role: firestoreData.role || "student",
              lastLogin: now,
            },
            $setOnInsert: {
              totalXp: 0,
              currentLevel: 1,
              xpToNextLevel: 100,
              currentStreak: 0,
              unlockedBadges: [],
              attendanceHistory: [],
              createdAt: now,
            },
          },
          { upsert: true }
        );
        results.mongoToFirestoreReconciled++;
      }
    }

    // Find UIDs that are in MongoDB but not Firestore → reconcile
    for (const uid of mongoUids) {
      if (!firestoreUids.has(uid)) {
        const mongoUser = mongoUsers.find((u) => u.firebaseUid === uid);
        if (!mongoUser) continue;

        const profile = {
          uid: mongoUser.firebaseUid,
          email: mongoUser.email || "",
          fullName: mongoUser.name || mongoUser.fullName || "",
          role: mongoUser.role || "student",
          createdAt: mongoUser.createdAt || new Date().toISOString(),
          lastLogin: mongoUser.lastLogin || null,
        };
        await db.collection("users").doc(uid).set(profile, { merge: true });
        results.firestoreToMongoReconciled++;
      }
    }
  } catch (err) {
    results.errors.push(`DB reconciliation failed: ${err.message}`);
  }

  // 3. Cleanup old pending operations
  try {
    await cleanupOldOperations();
  } catch (err) {
    results.errors.push(`Cleanup failed: ${err.message}`);
  }

  logger.info("[reconciliation-job] Completed", results);

  return jsonSuccess({
    message: "Reconciliation job completed",
    results,
  });
});
