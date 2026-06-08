import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initializeFirebase, getAdminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";
import {
  findStaleOperations,
  cleanupOldOperations,
} from "@/lib/transactionCoordinator";
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
  const decodedToken = await requireAuth(request);

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
      logger.info(
        `[reconciliation-job] Processing stale operation: ${op.operationId}`,
        {
          operationType: op.operationType,
          uid: op.uid,
          status: op.status,
        }
      );

      // If operation failed and was fully compensated, mark as resolved
      if (op.status === "compensating" && op.fullyCompensated) {
        await mongoDB
          .collection("pending_operations")
          .updateOne(
            { operationId: op.operationId },
            {
              $set: {
                status: "resolved_by_reconciliation",
                updatedAt: new Date(),
              },
            }
          );
      }
    }
  } catch (err) {
    results.errors.push(`Stale operations review failed: ${err.message}`);
  }

  // 2. Find orphaned Firebase Auth accounts (exist in Auth but not in any DB)
  try {
    const PAGE_SIZE = 500;

    // Page through Firestore users
    const firestoreUids = new Set();
    let firestoreCursor = null;
    do {
      let firestoreQuery = db.collection("users").limit(PAGE_SIZE);
      if (firestoreCursor) {
        firestoreQuery = firestoreQuery.startAfter(firestoreCursor);
      }
      const firestoreSnapshot = await firestoreQuery.get();
      if (firestoreSnapshot.empty) break;
      firestoreSnapshot.docs.forEach((doc) => firestoreUids.add(doc.id));
      firestoreCursor =
        firestoreSnapshot.docs[firestoreSnapshot.docs.length - 1];
    } while (firestoreCursor);

    // Page through MongoDB users
    const mongoUids = new Set();
    const mongoUsersMap = new Map();
    let mongoCursor = null;
    let lastBatchSize = 0;
    do {
      let mongoQuery = mongoDB
        .collection("users")
        .find({})
        .sort({ _id: 1 })
        .limit(PAGE_SIZE);
      if (mongoCursor) {
        mongoQuery = mongoQuery.skip(mongoCursor);
      }
      const mongoBatch = await mongoQuery.toArray();
      lastBatchSize = mongoBatch.length;
      if (lastBatchSize === 0) break;
      mongoBatch.forEach((u) => {
        if (u.firebaseUid) {
          mongoUids.add(u.firebaseUid);
          mongoUsersMap.set(u.firebaseUid, u);
        }
      });
      mongoCursor = (mongoCursor || 0) + lastBatchSize;
    } while (lastBatchSize === PAGE_SIZE);

    // Bulk-reconcile: Firestore → MongoDB
    const mongoBulkOps = [];
    for (const uid of firestoreUids) {
      if (!mongoUids.has(uid)) {
        const firestoreDoc = await db.collection("users").doc(uid).get();
        const firestoreData = firestoreDoc.data();
        if (!firestoreData) continue;

        const now = new Date().toISOString();
        mongoBulkOps.push({
          updateOne: {
            filter: { firebaseUid: uid },
            update: {
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
            upsert: true,
          },
        });
      }
    }
    if (mongoBulkOps.length > 0) {
      const bulkResult = await mongoDB
        .collection("users")
        .bulkWrite(mongoBulkOps, { ordered: false });
      results.mongoToFirestoreReconciled =
        bulkResult.upsertedCount + bulkResult.modifiedCount;
    }

    // Bulk-reconcile: MongoDB → Firestore
    let firestoreBatch = db.batch();
    let firestoreBatchSize = 0;
    let firestoreBatchOps = 0;
    for (const uid of mongoUids) {
      if (!firestoreUids.has(uid)) {
        const mongoUser = mongoUsersMap.get(uid);
        if (!mongoUser) continue;

        const profile = {
          uid: mongoUser.firebaseUid,
          email: mongoUser.email || "",
          fullName: mongoUser.name || mongoUser.fullName || "",
          role: mongoUser.role || "student",
          createdAt: mongoUser.createdAt || new Date().toISOString(),
          lastLogin: mongoUser.lastLogin || null,
        };
        firestoreBatch.set(db.collection("users").doc(uid), profile, {
          merge: true,
        });
        firestoreBatchSize++;
        firestoreBatchOps++;

        if (firestoreBatchSize >= 500) {
          await firestoreBatch.commit();
          firestoreBatch = db.batch();
          firestoreBatchSize = 0;
        }
      }
    }
    if (firestoreBatchSize > 0) {
      await firestoreBatch.commit();
    }
    results.firestoreToMongoReconciled = firestoreBatchOps;
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
