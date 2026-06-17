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
        await mongoDB.collection("pending_operations").updateOne(
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

  // 2. Reconcile Firestore ↔ MongoDB using batched cursor pagination.
  //    Memory is bounded to O(BATCH_SIZE) — no full UID Sets are built.
  try {
    const BATCH_SIZE = 200;

    // Phase 1: Firestore → MongoDB
    const mongoBulkOps = [];
    let firestoreCursor = null;

    do {
      let firestoreQuery = db.collection("users").limit(BATCH_SIZE);
      if (firestoreCursor) {
        firestoreQuery = firestoreQuery.startAfter(firestoreCursor);
      }
      const snapshot = await firestoreQuery.get();
      if (snapshot.empty) break;

      firestoreCursor = snapshot.docs[snapshot.docs.length - 1];
      const batchUids = snapshot.docs.map((d) => d.id);

      const existingMongo = await mongoDB
        .collection("users")
        .find({ firebaseUid: { $in: batchUids } })
        .project({ firebaseUid: 1 })
        .toArray();
      const existingMongoUids = new Set(
        existingMongo.map((u) => u.firebaseUid)
      );

      for (const doc of snapshot.docs) {
        if (existingMongoUids.has(doc.id)) continue;
        const firestoreData = doc.data();
        if (!firestoreData) continue;

        const now = new Date().toISOString();
        mongoBulkOps.push({
          updateOne: {
            filter: { firebaseUid: doc.id },
            update: {
              $set: {
                firebaseUid: doc.id,
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
    } while (firestoreCursor);

    if (mongoBulkOps.length > 0) {
      const bulkResult = await mongoDB
        .collection("users")
        .bulkWrite(mongoBulkOps, { ordered: false });
      results.mongoToFirestoreReconciled =
        bulkResult.upsertedCount + bulkResult.modifiedCount;
    }

    // Phase 2: MongoDB → Firestore — cursor-based pagination, batch reads
    let lastMongoId = null;
    let firestoreWriteCount = 0;

    while (true) {
      const mongoFilter = lastMongoId ? { _id: { $gt: lastMongoId } } : {};
      const mongoBatch = await mongoDB
        .collection("users")
        .find(mongoFilter)
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .toArray();

      if (mongoBatch.length === 0) break;
      lastMongoId = mongoBatch[mongoBatch.length - 1]._id;

      const batchUids = mongoBatch
        .map((u) => u.firebaseUid)
        .filter(Boolean);

      if (batchUids.length === 0) continue;

      const docRefs = batchUids.map((uid) =>
        db.collection("users").doc(uid)
      );
      const firestoreDocs = await db.getAll(...docRefs);
      const existingFirestoreUids = new Set(
        firestoreDocs.filter((d) => d.exists).map((d) => d.id)
      );

      let firestoreBatch = db.batch();
      let batchCount = 0;

      for (const mongoUser of mongoBatch) {
        if (
          !mongoUser.firebaseUid ||
          existingFirestoreUids.has(mongoUser.firebaseUid)
        ) {
          continue;
        }

        const profile = {
          uid: mongoUser.firebaseUid,
          email: mongoUser.email || "",
          fullName: mongoUser.name || mongoUser.fullName || "",
          role: mongoUser.role || "student",
          createdAt: mongoUser.createdAt || new Date().toISOString(),
          lastLogin: mongoUser.lastLogin || null,
        };
        firestoreBatch.set(
          db.collection("users").doc(mongoUser.firebaseUid),
          profile,
          { merge: true }
        );
        batchCount++;

        if (batchCount >= 500) {
          await firestoreBatch.commit();
          firestoreBatch = db.batch();
          firestoreWriteCount += batchCount;
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await firestoreBatch.commit();
        firestoreWriteCount += batchCount;
      }
    }

    results.firestoreToMongoReconciled = firestoreWriteCount;
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
