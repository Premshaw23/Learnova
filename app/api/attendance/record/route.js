import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { awardXp } from "@/lib/gamification-service";
import { getLocalDateKey } from "@/lib/dateUtils";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { executeSaga } from "@/lib/transactionCoordinator";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_record_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024);
  const { userId, studentName, email, confidenceScore, date } = body;
  const normalizedDate = (date || getLocalDateKey()).toString();

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

  // Use authoritative, verified data from Firebase JWT token (decodedToken) to completely prevent
  // client-supplied parameter spoofing and impersonation attacks.
  const resolvedName = userProfile?.fullName || decodedToken.name || decodedToken.displayName || decodedToken.email?.split("@")[0] || "Unknown User";
  const resolvedEmail = userProfile?.email || decodedToken.email || "unknown@learnova.edu";

  const sagaResult = await executeSaga({
    operationType: "attendance_record",
    uid: decodedToken.uid,
    steps: [
      {
        name: "write_attendance",
        execute: async () => {
          const docRef = db.collection("attendance_records").doc(`${userId}_${normalizedDate}`);
          await db.runTransaction(async (transaction) => {
            const existingDoc = await transaction.get(docRef);
            if (existingDoc.exists) {
              // Mark as already recorded — don't throw (idempotent)
              sagaResult._alreadyRecorded = true;
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
        },
        compensate: null, // Attendance writes are append-only
      },
      {
        name: "award_xp",
        execute: async () => {
          if (sagaResult._alreadyRecorded) {
            // Don't award XP if attendance was already recorded
            return;
          }
          await awardXp(userId, "attendance_marked", {
            attendanceHour: new Date().getHours(),
          });
        },
        compensate: null, // XP side-effect; failure doesn't block attendance
      },
    ],
  });

  if (sagaResult._alreadyRecorded) {
    return jsonSuccess({ alreadyRecorded: true }, 200);
  }

  if (!sagaResult.success) {
    // Attendance was written but XP award failed — log for reconciliation
    console.error(`[attendance] XP award failed for user ${userId}: ${sagaResult.error}`);
  }

  return jsonSuccess({ alreadyRecorded: false }, 201);
});
