import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initializeFirebase } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import admin from "firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { executeSaga } from "@/lib/transactionCoordinator";

import { withValidation } from "@/lib/validations/withValidation";
import { setRoleSchema } from "@/lib/validations/auth";

export const POST = withValidation(
  setRoleSchema,
  withErrorHandler(async (request, data) => {
    const decodedToken = await requireAuth(request);

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

    const sagaResult = await executeSaga({
      operationType: "set_role",
      uid: decodedToken.uid,
      steps: [
        {
          name: "set_auth_claims",
          execute: async () => {
            await admin.auth().setCustomUserClaims(decodedToken.uid, { role });
          },
          compensate: async () => {
            await admin.auth().setCustomUserClaims(decodedToken.uid, {});
          },
        },
        {
          name: "write_firestore",
          execute: async () => {
            await db
              .collection("users")
              .doc(decodedToken.uid)
              .set(userProfile, { merge: true });
          },
          compensate: async () => {
            await db.collection("users").doc(decodedToken.uid).delete();
          },
        },
        {
          name: "write_mongodb",
          execute: async () => {
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
          },
          compensate: async () => {
            const mongoDB = await connectDb();
            await mongoDB.collection("users").deleteOne({ firebaseUid: decodedToken.uid });
          },
        },
      ],
    });

    if (!sagaResult.success) {
      if (sagaResult.fullyCompensated) {
        return jsonError(
          "Account setup failed due to a server error. All changes have been rolled back. Please try again.",
          500
        );
      }
      return jsonError(
        "Account setup failed and some changes could not be rolled back. Please contact support for manual reconciliation.",
        500
      );
    }

    return jsonSuccess({ userProfile }, 201);
  }),
  { maxBytes: 1024 * 10 }
);
