import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { z } from "zod";

const ALLOWED_ROLES = ["student", "teacher", "institute"];

const setRoleSchema = z.object({
  role: z.enum(ALLOWED_ROLES, {
    errorMap: () => ({ message: "Role must be student, teacher, or institute" }),
  }),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  instituteName: z.string().trim().max(200).optional(),
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const body = await request.json();

  const validation = setRoleSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(
      validation.error.issues[0]?.message || "Validation failed",
      400
    );
  }

  const { role, fullName, instituteName } = validation.data;

  initializeFirebase();

  // Cryptographically sign the role into the Firebase token so the
  // middleware can verify it without touching Firestore
  await admin.auth().setCustomUserClaims(decodedToken.uid, { role });

  // Write the user profile to Firestore from the server so the client
  // cannot tamper with the role or any other field
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

  await admin
    .firestore()
    .collection("users")
    .doc(decodedToken.uid)
    .set(userProfile);

  return jsonSuccess({ userProfile }, 201);
});
