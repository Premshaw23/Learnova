import { NextResponse } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
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
  ).min(1),
});

export function normalizeConfidenceScore(confidenceScore) {
  let parsedScore = Number(confidenceScore);

  if (!Number.isFinite(parsedScore)) {
    return 0;
  }

  if (parsedScore > 1) {
    parsedScore = parsedScore / 100;
  }

  return Math.max(0, Math.min(1, parsedScore));
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
  
  // We use a Set to keep track of processed user-dates to prevent duplicate attendance
  // even within the same batch.
  const processedUserDates = new Set();

  const now = Date.now();
  const MAX_OFFLINE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

  for (const record of records) {
    // Only allow users to sync their own records (unless they are admin, but attendance is usually self-submitted)
    if (record.userId !== decodedToken.uid) {
      console.warn(`User ${decodedToken.uid} attempted to sync record for ${record.userId}`);
      continue;
    }

    // Validate timestamp: must be within the last 48 hours and not in the future (allowing 5 min clock skew)
    if (record.queuedAt > now + 5 * 60 * 1000 || record.queuedAt < now - MAX_OFFLINE_WINDOW_MS) {
      console.warn(`User ${decodedToken.uid} attempted to sync record with invalid queuedAt timestamp ${record.queuedAt}`);
      successfulIds.push(record.id); // Acknowledge to clear from client DB and prevent endless retry loop
      continue;
    }

    // Force date to match the validated queuedAt timestamp, but respect local timezone
    // to prevent UTC offset from logging attendance on the wrong day.
    const timeZone = process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Kolkata";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date(record.queuedAt));
    const year = parts.find((p) => p.type === "year").value;
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    const recordDate = `${year}-${month}-${day}`;

    const userDateKey = `${decodedToken.uid}_${recordDate}`;

    if (processedUserDates.has(userDateKey)) {
      successfulIds.push(record.id); // Acknowledge as success to remove from local queue
      continue;
    }

    // Atomic check-and-set using a Firestore transaction to prevent
    // duplicate records under concurrent sync requests from multiple tabs or devices.
    const newDocRef = db.collection("attendance_records").doc(`${decodedToken.uid}_${recordDate}`);

    await db.runTransaction(async (transaction) => {
      const existingAttendance = await transaction.get(newDocRef);
      if (existingAttendance.exists) {
        return;
      }

      if (
        (record.studentName && record.studentName !== serverIdentity.studentName) ||
        (record.email && record.email !== serverIdentity.email)
      ) {
        console.warn(
          `User ${decodedToken.uid} submitted offline attendance metadata that does not match the server profile`,
        );
      }

      transaction.set(newDocRef, {
        userId: decodedToken.uid,
        studentName: serverIdentity.studentName,
        email: serverIdentity.email,
        instituteId,
        timestamp: FieldValue.serverTimestamp(),
        date: recordDate,
        status: "present",
        confidenceScore: normalizeConfidenceScore(record.confidenceScore),
        offlineSynced: true,
        queuedAt: new Date(record.queuedAt),
      });
    });

    successfulIds.push(record.id);
    processedUserDates.add(userDateKey);
  }

  return NextResponse.json({
    success: true,
    syncedIds: successfulIds,
  });
}

export const POST = withErrorHandler(handleSync);
