import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest, parseJSON } from "@/lib/error-handler";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { awardXp } from "@/lib/gamification-service";

export const POST = withErrorHandler(async (request) => {
  // 1. Secure token validation ensures only logged-in users can ping this route
  const decodedToken = await authenticateRequest(request);

  const body = await parseJSON(request, 1024);
  const { userId, studentName, email, confidenceScore, date } = body;
  const normalizedDate = (date || new Date().toISOString().slice(0, 10)).toString();

  // 2. Ensure they are only submitting attendance for their own UID!
  if (decodedToken.uid !== userId) {
    return jsonError("Forbidden: Cannot submit attendance for another user", 403);
  }

  // 3. Ensure they actually matched the face threshold (60 is the minimum configured in the frontend)
  // Fix Client-Side Spoofing by rejecting undefined, null, strings, NaN, and out of bounds numbers
  const parsedConfidence = Number(confidenceScore);
  if (
    confidenceScore === undefined ||
    confidenceScore === null ||
    Number.isNaN(parsedConfidence) ||
    parsedConfidence < 60 ||
    parsedConfidence > 100
  ) {
    return jsonError("Bad Request: Invalid or spoofed confidence score", 400);
  }

  // Normalize confidence score to 0-1 range for consistency across the DB and dashboards
  const normalizedConfidence = parsedConfidence / 100;

  // 4. Write attendance to Firestore (single source of truth).
  // Use a deterministic doc id and a transaction to prevent duplicates and match client duplicate checks.
  initFirebaseAdmin();
  const db = getFirestore();
  const userProfile = await getUserProfile(decodedToken.uid);
  const instituteId = userProfile?.instituteId || null;
  const resolvedName = userProfile?.fullName || userProfile?.displayName || studentName;
  const resolvedEmail = userProfile?.email || email;

  const docRef = db.collection("attendance_records").doc(`${userId}_${normalizedDate}`);

  let alreadyRecorded = false;
  await db.runTransaction(async (transaction) => {
    const existingDoc = await transaction.get(docRef);
    if (existingDoc.exists) {
      alreadyRecorded = true;
      return;
    }

    transaction.set(
      docRef,
      {
        userId,
        studentName: resolvedName,
        email: resolvedEmail,
        instituteId,
        timestamp: FieldValue.serverTimestamp(),
        date: normalizedDate,
        status: "present",
        confidenceScore: normalizedConfidence,
        offlineSynced: false,
      },
      { merge: true },
    );
  });

  if (alreadyRecorded) {
    return jsonSuccess({ alreadyRecorded: true }, 200);
  }

  // Gamification is a side effect — failures must not block attendance recording
  try {
    await awardXp(userId, "attendance_marked", {
      attendanceHour: new Date().getHours(),
    });
  } catch (_) {
    // Silently swallow — attendance record is already saved
  }

  return jsonSuccess({ alreadyRecorded: false }, 201);
});
