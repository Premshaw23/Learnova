import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";

import { withValidation } from "@/lib/validations/withValidation";
import { setRoleSchema } from "@/lib/validations/auth";

export const POST = withValidation(
  setRoleSchema,
  withErrorHandler(async (request, data) => {
    const decodedToken = await authenticateRequest(request);

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

      if (existingRole && existingRole !== role) {
        return jsonError(
          `Forbidden: Account is already registered as "${existingRole}". Role cannot be changed.`,
          403
        );
      }
    } else if (decodedToken.role && decodedToken.role !== role) {
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

    return jsonSuccess({ userProfile }, 201);
  })
);