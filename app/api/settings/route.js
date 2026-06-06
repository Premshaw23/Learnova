import { connectDb } from "@/lib/mongodb";
import { getUserProfile, initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { success } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { ForbiddenError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { settingsSchema, validateOrThrow } from "@/lib/validations";

export const PATCH = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `settings_patch_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const { userId: bodyUserId, ...settings } = await validateOrThrow(request, settingsSchema, 1024 * 100);

  // Restrict institute-level settings to privileged roles only
  if (settings.institute) {
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile || !["admin", "institute"].includes(profile.role)) {
      throw new ForbiddenError(
        "Forbidden: Only institute admins can modify institute settings."
      );
    }
  }

  let targetUserId = decodedToken.uid;
  let isOperatorAdmin = false;

  if (bodyUserId && bodyUserId !== decodedToken.uid) {
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile || profile.role !== "admin") {
      throw new ForbiddenError(
        "Forbidden: You are not authorized to update another user's settings."
      );
    }
    targetUserId = bodyUserId;
    isOperatorAdmin = true;
  }

  const flattenObject = (obj, prefix = "") => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + "." : "";
      if (
        typeof obj[k] === "object" &&
        obj[k] !== null &&
        !Array.isArray(obj[k])
      ) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  const updatePayload = flattenObject(settings);
  updatePayload.updatedAt = new Date();

  let db;
  try {
    db = await connectDb();
  } catch (error) {
    throw new AppError(
      "Database connection timed out or failed. Please try again.",
      503
    );
  }

  try {
    await db
      .collection("settings")
      .updateOne(
        { userId: targetUserId },
        { $set: updatePayload },
        { upsert: true }
      );
  } catch (error) {
    logger.error("Settings sync error:", { error: error.message });
    throw new AppError("Failed to update user settings database entry.", 500);
  }

  // Sync profile updates to Firestore to prevent split-brain desync
  if (settings.profile) {
    initializeFirebase();
    const firestoreProfileUpdate = {};

    if (settings.profile.name !== undefined)
      firestoreProfileUpdate.displayName = settings.profile.name;
    if (settings.profile.bio !== undefined)
      firestoreProfileUpdate.bio = settings.profile.bio;
    if (settings.profile.phone !== undefined)
      firestoreProfileUpdate.phone = settings.profile.phone;
    if (settings.profile.avatar !== undefined)
      firestoreProfileUpdate.avatar = settings.profile.avatar;

    if (Object.keys(firestoreProfileUpdate).length > 0) {
      try {
        await admin
          .firestore()
          .collection("users")
          .doc(targetUserId)
          .set(firestoreProfileUpdate, { merge: true });

        logger.info(
          `[Firestore Sync] Profile synced for user: ${targetUserId}`
        );
      } catch (syncError) {
        logger.error("Firestore profile sync failed:", {
          error: syncError.message,
        });
      }
    }
  }

  const operatorRole = isOperatorAdmin ? "admin" : "owner";
  console.log(
    `[Audit Log] Settings updated successfully for target user: ${targetUserId} by operator: ${decodedToken.uid} (Role: ${operatorRole})`
  );

  return success({ message: "Settings saved successfully" });
});
