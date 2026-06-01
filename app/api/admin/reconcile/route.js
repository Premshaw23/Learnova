import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdmin } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { findStaleOperations, cleanupOldOperations } from "@/lib/transactionCoordinator";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reconcile
 *
 * Reconciles a single user across Firebase Auth, Firestore, and MongoDB.
 * Handles four cases:
 * 1. User in both Firestore and MongoDB → no action
 * 2. User in MongoDB but not Firestore → create Firestore profile
 * 3. User in Firestore but not MongoDB → create MongoDB document
 * 4. User in Firebase Auth but nowhere else → clean up orphaned auth account
 *
 * Additionally triggers cleanup of stale pending_operations records.
 */
export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireAdmin(request);

  const { uid } = await request.json();
  if (!uid || typeof uid !== "string") {
    return jsonError("Firebase UID is required", 400);
  }

  initializeFirebase();
  const db = admin.firestore();
  const mongoDB = await connectDb();

  // Check all three stores
  let hasAuth = false;
  try {
    await admin.auth().getUser(uid);
    hasAuth = true;
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      hasAuth = false;
    } else {
      throw new AppError("Failed to verify Firebase Auth user", 500);
    }
  }

  const firestoreDoc = await db.collection("users").doc(uid).get();
  const hasFirestore = firestoreDoc.exists;
  const firestoreData = hasFirestore ? firestoreDoc.data() : null;

  const mongoUser = await mongoDB.collection("users").findOne({ firebaseUid: uid });
  const hasMongo = !!mongoUser;

  // Case 1: User exists in all relevant stores (or Auth + at least one DB)
  if (hasFirestore && hasMongo) {
    // Also cleanup stale pending operations as a side-effect
    await cleanupOldOperations();

    return jsonSuccess({
      message: "User already exists in both databases",
      auth: hasAuth,
      firestore: true,
      mongo: true,
    });
  }

  // Case 4: User exists in Auth but NOT in Firestore and NOT in MongoDB → orphaned
  if (hasAuth && !hasFirestore && !hasMongo) {
    logger.warn(`[reconcile] Orphaned auth account detected: ${uid}. Deleting.`);
    try {
      await admin.auth().deleteUser(uid);
    } catch (deleteErr) {
      logger.error(`[reconcile] Failed to delete orphaned auth account ${uid}:`, { error: deleteErr.message });
      return jsonError("Failed to clean up orphaned auth account. Please try again.", 500);
    }

    return jsonSuccess({
      message: "Orphaned Firebase Auth account detected and deleted",
      auth: false,
      firestore: false,
      mongo: false,
      action: "orphaned_auth_deleted",
    });
  }

  const actions = [];

  // Case 2: User in MongoDB but not Firestore → create Firestore profile
  if (!hasFirestore && mongoUser) {
    const profile = {
      uid: mongoUser.firebaseUid,
      email: mongoUser.email || "",
      fullName: mongoUser.name || mongoUser.fullName || "",
      role: mongoUser.role || "student",
      createdAt: mongoUser.createdAt || new Date().toISOString(),
      lastLogin: mongoUser.lastLogin || null,
    };
    await db.collection("users").doc(uid).set(profile, { merge: true });
    actions.push("firestore_profile_created");
  }

  // Case 3: User in Firestore but not MongoDB → create MongoDB document
  if (!hasMongo && firestoreData) {
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
    actions.push("mongo_document_created");
  }

  if (actions.length === 0) {
    return jsonError("User not found in either database", 404);
  }

  return jsonSuccess({
    message: "User reconciled successfully",
    actions,
    auth: hasAuth,
    firestore: true,
    mongo: true,
  });
});

/**
 * GET /api/admin/reconcile
 *
 * Returns a summary of stale pending operations that need manual review.
 * Used by admins to monitor cross-database transaction health.
 */
export const GET = withErrorHandler(async (request) => {
  await requireAdmin(request);

  const staleOps = await findStaleOperations(300000); // 5 minutes threshold

  // Also trigger cleanup of old completed operations
  await cleanupOldOperations();

  return jsonSuccess({
    staleOperations: staleOps.map((op) => ({
      operationId: op.operationId,
      operationType: op.operationType,
      uid: op.uid,
      status: op.status,
      failedStep: op.failedStep,
      error: op.error,
      fullyCompensated: op.fullyCompensated,
      createdAt: op.createdAt,
      updatedAt: op.updatedAt,
    })),
    count: staleOps.length,
  });
});
