import { NextResponse } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { getLocalDateKey } from "@/lib/dateUtils";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { executeSaga } from "@/lib/transactionCoordinator";
import { enqueue, JOB_TYPES } from "@/lib/queue";
import { connectDb } from "@/lib/mongodb";
import {
  recalculateStats,
  mapWithConcurrency,
} from "@/lib/services/attendanceService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const syncSchema = z.object({
  records: z
    .array(
      z.object({
        id: z.number().optional(), // IDB key
        userId: z.string(),
        studentName: z.string().optional(),
        email: z.string().optional(),
        confidenceScore: z.number().optional(),
        queuedAt: z.number(),
        date: z.string().optional(),
      })
    )
    .min(1)
    .max(100, "Too many records in a single sync batch"),
});

// Minimum face-match confidence required to record attendance.
// Must stay in sync with the threshold enforced in app/api/attendance/record/route.js.
const MIN_CONFIDENCE_THRESHOLD = 0.6;

// Max number of records processed concurrently. Keeps burst Firestore/MongoDB
// write pressure bounded on serverless runtimes while parallelizing the batch.
const SYNC_CONCURRENCY = 5;

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
  const profileName = [
    userProfile?.fullName,
    userProfile?.displayName,
    decodedToken?.name,
  ]
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

/**
 * Builds the saga steps for a single attendance record. `recalculate_stats`
 * is intentionally NOT a step here: it re-scans the entire attendance_records
 * collection for the user, so running it per record makes a batch O(N²). The
 * sync handler runs it exactly once after the whole batch completes.
 */
function buildSyncSagaSteps({
  db,
  mongoDb,
  uid,
  recordDate,
  serverIdentity,
  instituteId,
  normalizedConfidence,
  queuedAt,
}) {
  return [
    {
      name: "write_attendance",
      // Fix for #3559: use field-level update() on existing documents instead of a
      // full set(), so concurrent offline syncs for the same user-date cannot
      // silently overwrite fields written by a racing request that arrived first.
      execute: async (ctx) => {
        const newDocRef = db
          .collection("attendance_records")
          .doc(`${uid}_${recordDate}`);

        await db.runTransaction(async (transaction) => {
          const existingAttendance = await transaction.get(newDocRef);

          if (existingAttendance.exists) {
            // Document already exists — another write (online or a prior sync)
            // got here first. Mark as already processed so downstream steps
            // (MongoDB write, XP award) are skipped, preserving the original
            // record's integrity.
            ctx._alreadyProcessed = true;
            return;
          }

          // Document does not exist — safe to create it with a full set().
          // No merge flag: we own this new document entirely.
          transaction.set(newDocRef, {
            userId: uid,
            studentName: serverIdentity.studentName,
            email: serverIdentity.email,
            instituteId,
            timestamp: FieldValue.serverTimestamp(),
            date: recordDate,
            status: "present",
            confidenceScore: normalizedConfidence,
            offlineSynced: true,
            queuedAt: new Date(queuedAt),
          });
        });
      },
      compensate: null, // Attendance writes are append-only; no rollback needed
    },
    {
      name: "write_mongodb_attendance",
      execute: async (ctx) => {
        if (ctx._alreadyProcessed) return;
        try {
          // $set is inherently field-level in MongoDB — only the listed fields are
          // touched; no risk of clobbering unrelated fields on a concurrent write.
          await mongoDb.collection("attendance").updateOne(
            { userId: uid, date: recordDate },
            {
              $set: {
                userId: uid,
                studentName: serverIdentity.studentName,
                email: serverIdentity.email,
                instituteId,
                timestamp: new Date(queuedAt),
                date: recordDate,
                status: "present",
                confidenceScore: normalizedConfidence,
                offlineSynced: true,
                queuedAt: new Date(queuedAt),
              },
            },
            { upsert: true }
          );
        } catch (err) {
          // E11000 = duplicate key — another concurrent request already wrote
          // this record. Mark as processed so we don't fail the whole batch.
          if (err?.code === 11000) {
            ctx._alreadyProcessed = true;
            return;
          }
          throw err;
        }
      },
      compensate: async () => {
        await mongoDb.collection("attendance").deleteOne({
          userId: uid,
          date: recordDate,
        });
      },
    },
    {
      name: "award_xp",
      execute: async (ctx) => {
        if (ctx._alreadyProcessed) return;
        await enqueue(JOB_TYPES.AWARD_GAMIFICATION_XP, {
          firebaseUid: uid,
          actionType: "attendance_marked",
          metadata: {
            attendanceHour: queuedAt
              ? new Date(queuedAt).getHours()
              : new Date().getHours(),
            attendanceDate: recordDate,
          },
        });
      },
      compensate: null,
    },
    {
      name: "write_activity",
      execute: async (ctx) => {
        if (ctx._alreadyProcessed) return;
        const hour = queuedAt
          ? new Date(queuedAt).getHours()
          : new Date().getHours();
        const minutes = queuedAt
          ? new Date(queuedAt).getMinutes()
          : new Date().getMinutes();
        const isLate = hour >= 9 && minutes > 10;
        await db.collection("activities").add({
          userId: uid,
          title: "Class Attendance",
          type: "course",
          progress: isLate ? 50 : 100,
          timestamp: FieldValue.serverTimestamp(),
        });
      },
      compensate: null,
    },
  ];
}

async function handleSync(request) {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `attendance_sync_${ip}_${decodedToken.uid}`
  );
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
      { status: 404 }
    );
  }

  if (!userProfile?.instituteId) {
    return NextResponse.json(
      {
        success: false,
        error:
          "User profile missing institute affiliation. Cannot sync attendance.",
      },
      { status: 403 }
    );
  }

  const serverIdentity = resolveAttendanceIdentity(decodedToken, userProfile);
  const instituteId = userProfile.instituteId;

  const successfulIds = [];
  const rejectedIds = [];

  const now = Date.now();
  const MAX_OFFLINE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

  // Validate the batch up front and collapse duplicate (uid, date) records
  // into a single write. Duplicate dates are acknowledged as success so the
  // client clears them from its local queue, matching the previous behavior.
  const seenUserDates = new Set();
  const dedupAckByDate = new Map();
  const recordsToSync = [];

  for (const record of records) {
    // Only allow users to sync their own records (unless they are admin, but attendance is usually self-submitted)
    if (record.userId !== decodedToken.uid) {
      console.warn(
        `User ${decodedToken.uid} attempted to sync record for ${record.userId}`
      );
      if (record.id !== undefined) {
        rejectedIds.push(record.id);
      }
      continue;
    }

    // Validate timestamp: must be within the last 48 hours and not in the future (allowing 5 min clock skew)
    if (
      record.queuedAt > now + 5 * 60 * 1000 ||
      record.queuedAt < now - MAX_OFFLINE_WINDOW_MS
    ) {
      console.warn(
        `User ${decodedToken.uid} attempted to sync record with invalid queuedAt timestamp ${record.queuedAt}`
      );
      rejectedIds.push(record.id);
      continue;
    }

    // Derive the calendar date from the validated queuedAt timestamp using the
    // shared timezone-aware utility. This guarantees the same date key that the
    // online record path produces (fix for Issue #1234 timestamp drift).
    const recordDate = getLocalDateKey(record.queuedAt);

    const userDateKey = `${decodedToken.uid}_${recordDate}`;

    if (seenUserDates.has(userDateKey)) {
      const ackIds = dedupAckByDate.get(userDateKey) || [];
      ackIds.push(record.id);
      dedupAckByDate.set(userDateKey, ackIds);
      continue;
    }

    // Reject records whose face-match confidence is below the minimum threshold.
    // The online attendance path enforces >= 60%; offline sync must apply the same guard.
    const normalizedConfidence = normalizeConfidenceScore(
      record.confidenceScore
    );
    if (normalizedConfidence === null) {
      console.warn(
        `User ${decodedToken.uid} submitted offline attendance with confidence below threshold (raw: ${record.confidenceScore})`
      );
      if (record.id !== undefined) {
        rejectedIds.push(record.id);
      }
      continue;
    }

    seenUserDates.add(userDateKey);
    recordsToSync.push({ record, recordDate, normalizedConfidence });
  }

  if (recordsToSync.length > 0) {
    // Resolve the Mongo connection once and share it across the batch instead
    // of re-awaiting connectDb() inside every record's saga.
    const mongoDb = await connectDb();

    // Run the per-record sagas with bounded concurrency. Idempotency is safe
    // because the deterministic document id (uid_date) plus the MongoDB unique
    // index guard against duplicates even when records run in parallel.
    const results = await mapWithConcurrency(
      recordsToSync,
      SYNC_CONCURRENCY,
      ({ record, recordDate, normalizedConfidence }) =>
        executeSaga({
          operationType: "attendance_sync",
          uid: decodedToken.uid,
          steps: buildSyncSagaSteps({
            db,
            mongoDb,
            uid: decodedToken.uid,
            recordDate,
            serverIdentity,
            instituteId,
            normalizedConfidence,
            queuedAt: record.queuedAt,
          }),
        }).then((sagaResult) => ({ record, recordDate, sagaResult }))
    );

    let wroteNewAttendance = false;

    for (const { record, recordDate, sagaResult } of results) {
      if (sagaResult.success) {
        successfulIds.push(record.id);
        const dedupAcks = dedupAckByDate.get(
          `${decodedToken.uid}_${recordDate}`
        );
        if (dedupAcks && dedupAcks.length > 0) {
          successfulIds.push(...dedupAcks);
        }
        if (!sagaResult.context?._alreadyProcessed) {
          wroteNewAttendance = true;
        }
      } else {
        console.error(
          `[attendance-sync] Saga failed for user ${decodedToken.uid} date ${recordDate}: ${sagaResult.error}`
        );
        if (record.id !== undefined) {
          rejectedIds.push(record.id);
        }
      }
    }

    // Recalculate the user's attendance stats exactly once for the whole batch.
    // The result depends only on the full attendance_records set, so N recalculations
    // were never more correct than one. Skipped entirely when nothing new was written.
    if (wroteNewAttendance) {
      await recalculateStats(db, decodedToken.uid);
    }
  }

  return NextResponse.json({
    success: true,
    syncedIds: successfulIds,
    rejectedIds,
    ...(rejectedIds.length > 0 && {
      warning:
        "Some records were not synced because they exceeded the 48-hour offline window. These records have been removed from your local queue.",
    }),
  });
}

export const POST = withErrorHandler(handleSync);
