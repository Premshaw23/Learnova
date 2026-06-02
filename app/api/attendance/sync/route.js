import { NextResponse } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { getLocalDateKey } from "@/lib/dateUtils";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { awardXp } from "@/lib/gamification-service";
import { executeSaga } from "@/lib/transactionCoordinator";
import { connectDb } from "@/lib/mongodb";
import { z } from "zod";


export const dynamic = "force-dynamic";

const syncSchema = z.object({
  records: z.array(
    z.object({
      id: z.number().optional(), // IDB key
      userId: z.string(),
      studentName: z.string().optional(),
      email: z.string().optional(),
      confidenceScore: z.number().optional(),
      queuedAt: z.number(),
      date: z.string().optional(),
    })
  ).min(1).max(100, "Too many records in a single sync batch"),
});

// Minimum face-match confidence required to record attendance.
// Must stay in sync with the threshold enforced in app/api/attendance/record/route.js.
const MIN_CONFIDENCE_THRESHOLD = 0.6;

export function normalizeConfidenceScore(confidenceScore) {
  let parsedScore = Number(confidenceScore);

  if (!Number.isFinite(parsedScore)) {
    return null;
  }

  // Accept both percentage form (60-100) and decimal form (0.0-1.0)
  if (parsedScore > 1) {
    parsedScore = parsedScore / 100;
  }

  const clamped = Math.max(0, Math.min(1, parsedScore));

  // Reject scores below the same threshold applied in the online attendance path
  if (clamped < MIN_CONFIDENCE_THRESHOLD) {
    return null;
  }

  return clamped;
}

function resolveAttendanceIdentity(decodedToken, userProfile) {
  const profileName = [userProfile?.fullName, userProfile?.displayName, decodedToken?.name]
    .find((value) => typeof value === "string" && value.trim())
    ?.trim();

  const profileEmail = [userProfile?.email, decodedToken?.email]
    .find((value) => typeof value === "string" && value.trim())
    ?.trim();

  return {
    studentName: profileName || "Unknown User",
    email: profileEmail || "",
  };
}

async function handleSync(request) {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_sync_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const body = await parseJSON(request, 1024 * 100);
  const { records } = syncSchema.parse(body);

  initFirebaseAdmin();
  const db = getFirestore();
  const userProfile = await getUserProfile(decodedToken.uid);

  if (!userProfile) {
    return NextResponse.json(
      {
        success: false,
        error: "User profile not found for attendance sync.",
      },
      { status: 404 },
    );
  }

  const serverIdentity = resolveAttendanceIdentity(decodedToken, userProfile);
  const instituteId = userProfile?.instituteId || null;
  
  const successfulIds = [];
  const rejectedIds = [];

  // We use a Set to keep track of processed user-dates to prevent duplicate attendance
  // even within the same batch.
  const processedUserDates = new Set();

  const now = Date.now();
  const MAX_OFFLINE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

  for (const record of records) {
    // Only allow users to sync their own records (unless they are admin, but attendance is usually self-submitted)
    if (record.userId !== decodedToken.uid) {
      console.warn(`User ${decodedToken.uid} attempted to sync record for ${record.userId}`);
      if (record.id !== undefined) {
        rejectedIds.push(record.id);
      }
      continue;
    }

    // Validate timestamp: must be within the last 48 hours and not in the future (allowing 5 min clock skew)
    if (record.queuedAt > now + 5 * 60 * 1000 || record.queuedAt < now - MAX_OFFLINE_WINDOW_MS) {
      console.warn(`User ${decodedToken.uid} attempted to sync record with invalid queuedAt timestamp ${record.queuedAt}`);
      rejectedIds.push(record.id);
      continue;
    }

    // Derive the calendar date from the validated queuedAt timestamp using the
    // shared timezone-aware utility. This guarantees the same date key that the
    // online record path produces (fix for Issue #1234 timestamp drift).
    const recordDate = getLocalDateKey(record.queuedAt);

    const userDateKey = `${decodedToken.uid}_${recordDate}`;

    if (processedUserDates.has(userDateKey)) {
      successfulIds.push(record.id); // Acknowledge as success to remove from local queue
      continue;
    }

    // Reject records whose face-match confidence is below the minimum threshold.
    // The online attendance path enforces >= 60%; offline sync must apply the same guard.
    const normalizedConfidence = normalizeConfidenceScore(record.confidenceScore);
    if (normalizedConfidence === null) {
      console.warn(
        `User ${decodedToken.uid} submitted offline attendance with confidence below threshold (raw: ${record.confidenceScore})`,
      );
      if (record.id !== undefined) {
        rejectedIds.push(record.id);
      }
      continue;
    }

    // Use saga to atomically write attendance + award XP.
    // If XP awarding fails, attendance is still recorded (it's the primary write),
    // but the saga tracks the failure for reconciliation.
    const sagaResult = await executeSaga({
      operationType: "attendance_sync",
      uid: decodedToken.uid,
      steps: [
        {
          name: "write_attendance",
          execute: async () => {
            const newDocRef = db.collection("attendance_records").doc(`${decodedToken.uid}_${recordDate}`);
            await db.runTransaction(async (transaction) => {
              const existingAttendance = await transaction.get(newDocRef);
              if (existingAttendance.exists) {
                // Already recorded — skip write but don't throw (idempotent)
                return;
              }

              transaction.set(newDocRef, {
                userId: decodedToken.uid,
                studentName: serverIdentity.studentName,
                email: serverIdentity.email,
                instituteId,
                timestamp: FieldValue.serverTimestamp(),
                date: recordDate,
                status: "present",
                confidenceScore: normalizedConfidence,
                offlineSynced: true,
                queuedAt: new Date(record.queuedAt),
              });
            });
          },
          compensate: null, // Attendance writes are append-only; no rollback needed
        },
        {
          name: "write_mongodb_attendance",
          execute: async () => {
            const mongoDB = await connectDb();
            await mongoDB.collection("attendance").updateOne(
              { userId: decodedToken.uid, date: recordDate },
              {
                $set: {
                  userId: decodedToken.uid,
                  studentName: serverIdentity.studentName,
                  email: serverIdentity.email,
                  instituteId,
                  timestamp: new Date(record.queuedAt),
                  date: recordDate,
                  status: "present",
                  confidenceScore: normalizedConfidence,
                  offlineSynced: true,
                  queuedAt: new Date(record.queuedAt),
                },
              },
              { upsert: true }
            );
          },
          compensate: async () => {
            const mongoDB = await connectDb();
            await mongoDB.collection("attendance").deleteOne({ userId: decodedToken.uid, date: recordDate });
          },
        },
        {
          name: "award_xp",
          execute: async () => {
            await awardXp(decodedToken.uid, "attendance_marked", {
              attendanceHour: record.queuedAt ? new Date(record.queuedAt).getHours() : new Date().getHours(),
            });
          },
          compensate: null, // XP is a side-effect; failure doesn't block attendance
        },
      ],
    });

    if (sagaResult.success) {
      successfulIds.push(record.id);
      processedUserDates.add(userDateKey);
    } else {
      console.error(`[attendance-sync] Saga failed for user ${decodedToken.uid} date ${recordDate}: ${sagaResult.error}`);
      if (record.id !== undefined) {
        rejectedIds.push(record.id);
      }
    }
  }

  return NextResponse.json({
    success: true,
    syncedIds: successfulIds,
    rejectedIds,
    ...(rejectedIds.length > 0 && {
      warning: "Some records were not synced because they exceeded the 48-hour offline window. These records have been removed from your local queue.",
    }),
  });
}

export const POST = withErrorHandler(handleSync);
