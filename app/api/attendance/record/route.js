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
import { connectDb } from "@/lib/mongodb";
import { recordAttendanceSchema } from "@/lib/validations/attendance";
import { validateRequest } from "@/lib/validations/validateRequest";


export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_record_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  // 1. Validate request body against schema
  const validationResult = await validateRequest(request, recordAttendanceSchema);
  if (!validationResult.success) {
    return validationResult.response;
  }
  
  const { userId, studentName, email, confidenceScore, date } = validationResult.data;
  const normalizedDate = date || getLocalDateKey();

  // 2. Ensure they are only submitting attendance for their own UID, OR they are a teacher/admin!
  const isTeacherOrAdmin = decodedToken.role === "teacher" || decodedToken.role === "admin";
  if (decodedToken.uid !== userId && !isTeacherOrAdmin) {
    return jsonError("Forbidden: Cannot submit attendance for another user", 403);
  }

  // 3. Ensure they actually matched the face threshold (60 is the minimum configured in the frontend)
  const parsedConfidence = Number(confidenceScore);
  if (parsedConfidence < 60) {
    return jsonError("Bad Request: Confidence score too low", 400);
  }

  // Normalize confidence score to 0-1 range for consistency across the DB and dashboards
  const normalizedConfidence = parsedConfidence / 100;

  // 4. Write attendance to Firestore (single source of truth).
  // Use a deterministic doc id and a transaction to prevent duplicates and match client duplicate checks.
  initFirebaseAdmin();
  const db = getFirestore();


  // Authoritatively fetch target student profile or use caller profile
  const targetUid = userId || decodedToken.uid;
  const userProfile = await getUserProfile(targetUid);
  const callerProfile = decodedToken.uid !== targetUid ? await getUserProfile(decodedToken.uid) : userProfile;
  const instituteId = userProfile?.instituteId || callerProfile?.instituteId || null;

  // Use authoritative, verified data from profile to prevent client-supplied parameter spoofing
  const resolvedName = userProfile?.fullName || (decodedToken.uid === targetUid ? (decodedToken.name || decodedToken.displayName) : null) || studentName || "Unknown User";
  const resolvedEmail = userProfile?.email || (decodedToken.uid === targetUid ? decodedToken.email : null) || email || "unknown@learnova.edu";

  const sagaResult = await executeSaga({
    operationType: "attendance_record",
    uid: decodedToken.uid,
    steps: [
      {
        name: "write_attendance",
        execute: async (ctx) => {
          const docRef = db.collection("attendance_records").doc(`${userId}_${normalizedDate}`);
          await db.runTransaction(async (transaction) => {
            const existingDoc = await transaction.get(docRef);
            if (existingDoc.exists) {
              // Mark as already recorded — don't throw (idempotent)
              ctx._alreadyRecorded = true;
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
        name: "write_mongodb_attendance",
        execute: async (ctx) => {
          if (ctx._alreadyRecorded) {
            return;
          }
          const mongoDB = await connectDb();
          await mongoDB.collection("attendance").updateOne(
            { userId, date: normalizedDate },
            {
              $set: {
                userId,
                studentName: resolvedName,
                email: resolvedEmail,
                instituteId,
                timestamp: new Date(),
                date: normalizedDate,
                status: "present",
                confidenceScore: normalizedConfidence,
                offlineSynced: false,
              },
            },
            { upsert: true }
          );
        },
        compensate: async () => {
          const mongoDB = await connectDb();
          await mongoDB.collection("attendance").deleteOne({ userId, date: normalizedDate });
        },
      },
      {
        name: "award_xp",
        execute: async (ctx) => {
          if (ctx._alreadyRecorded) {
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

  if (sagaResult.context._alreadyRecorded) {
    return jsonSuccess({ alreadyRecorded: true }, 200);
  }

  if (!sagaResult.success) {
    if (sagaResult.failedStep === "award_xp") {
      console.error(`[attendance] XP award failed for user ${userId}: ${sagaResult.error}`);
    } else {
      console.error(`[attendance] Saga failed at step "${sagaResult.failedStep}" for user ${userId}: ${sagaResult.error}`);
      return jsonError("Attendance recording failed", 502);
    }
  }

  return jsonSuccess({ alreadyRecorded: false }, 201);
});
