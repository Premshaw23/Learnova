import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { initializeFirebase } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";

import { withValidation } from "@/lib/validations/withValidation";
import { setRoleSchema } from "@/lib/validations/auth";

export const POST = withValidation(
  setRoleSchema,
  withErrorHandler(async (request, data) => {
    const decodedToken = await authenticateRequest(request);

    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitResult = await checkRateLimit(`set_role_${ip}_${decodedToken.uid}`);
    if (!rateLimitResult.allowed) {
      throw new AppError("Too many attempts. Please try again later.", 429);
    }

    const { role, fullName, instituteName, inviteCode } = data;

    // --- Privilege Escalation Fix: Enforce Invite Codes for Elevated Roles ---
    if (role === "teacher") {
      const expectedCode = process.env.TEACHER_INVITE_CODE;
      if (!expectedCode || inviteCode !== expectedCode) {
        return jsonError("Forbidden: Invalid or missing teacher invite code.", 403);
      }
    } else if (role === "institute") {
      const expectedCode = process.env.INSTITUTE_INVITE_CODE;
      if (!expectedCode || inviteCode !== expectedCode) {
        return jsonError("Forbidden: Invalid or missing institute invite code.", 403);
      }
    }
    // ------------------------------------------------------------------------

    initializeFirebase();
    const db = admin.firestore();

    // Prevent privilege escalation
    const existingProfile = await db
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (existingProfile.exists) {
      const existingRole = existingProfile.data()?.role;

      if (existingRole) {
        return jsonError(
          `Forbidden: Account is already registered as "${existingRole}". Role cannot be changed.`,
          403
        );
      }
    } else if (decodedToken.role) {
      return jsonError(
        `Forbidden: Token already carries role "${decodedToken.role}". Role cannot be changed.`,
        403
      );
    }

    await admin.auth().setCustomUserClaims(decodedToken.uid, {
      role,
    });

    const userProfile = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      fullName,
      role,
      createdAt: new Date().toISOString(),
      emailVerified: decodedToken.email_verified || false,
      lastLogin: new Date().toISOString(),
    };

    if (role === "institute" && instituteName) {
      userProfile.instituteName = instituteName;
    }

    await db
      .collection("users")
      .doc(decodedToken.uid)
      .set(userProfile, { merge: true });

    // Sync user to MongoDB so gamification (awardXp) and biometric labels
    // endpoints can locate the student by their Firebase UID.
    try {
      const mongoDB = await connectDb();
      const now = new Date().toISOString();

      await mongoDB.collection("users").updateOne(
        { firebaseUid: decodedToken.uid },
        {
          $set: {
            firebaseUid: decodedToken.uid,
            email: decodedToken.email,
            name: fullName,
            fullName,
            role,
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
    } catch (mongoErr) {
      // MongoDB sync is non-blocking — Firestore is the primary store.
      // Log the error but do not fail the registration flow.
      console.error("[set-role] MongoDB user sync failed:", mongoErr.message);
    }

    return jsonSuccess({ userProfile }, 201);
  })
);
