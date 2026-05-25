import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const POST = withErrorHandler(async (request) => {
  // 1. Secure token validation ensures only logged-in users can ping this route
  const decodedToken = await authenticateRequest(request);

  const body = await request.json();
  const { userId, studentName, email, confidenceScore, date } = body;
  const normalizedDate = (date || new Date().toISOString().slice(0, 10)).toString();

  // 2. Ensure they are only submitting attendance for their own UID!
  if (decodedToken.uid !== userId) {
    return jsonError("Forbidden: Cannot submit attendance for another user", 403);
  }

  // 3. Ensure they actually matched the face threshold (60 is the minimum configured in the frontend)
  if (confidenceScore < 60) {
    return jsonError("Bad Request: Confidence score too low", 400);
  }

  // 4. Write attendance to Firestore (single source of truth).
  // Use a deterministic doc id to prevent duplicates and match client duplicate checks.
  initFirebaseAdmin();
  const db = getFirestore();
  const userProfile = await getUserProfile(decodedToken.uid);
  const instituteId = userProfile?.instituteId || null;
  const resolvedName = userProfile?.fullName || userProfile?.displayName || studentName;
  const resolvedEmail = userProfile?.email || email;

  await db
    .collection("attendance_records")
    .doc(`${userId}_${normalizedDate}`)
    .set(
      {
        userId,
        studentName: resolvedName,
        email: resolvedEmail,
        instituteId,
        timestamp: FieldValue.serverTimestamp(),
        date: normalizedDate,
        status: "present",
        confidenceScore,
        offlineSynced: false,
      },
      { merge: true },
    );

  return jsonSuccess({ alreadyRecorded: false }, 201);
});
