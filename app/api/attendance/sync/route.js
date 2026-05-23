import { NextResponse } from "next/server";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const syncSchema = z.object({
  records: z.array(
    z.object({
      id: z.number().optional(), // IDB key
      userId: z.string(),
      studentName: z.string(),
      email: z.string(),
      confidenceScore: z.number(),
      queuedAt: z.number(),
      date: z.string().optional(),
    })
  ).min(1),
});

async function handleSync(request) {
  const decodedToken = await requireAuth(request);
  const body = await request.json();
  const { records } = syncSchema.parse(body);

  initFirebaseAdmin();
  const db = getFirestore();
  const batch = db.batch();
  
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

    // Force date to match the validated queuedAt timestamp, ignoring any spoofed client date
    const recordDate = new Date(record.queuedAt).toISOString().slice(0, 10);
    const userDateKey = `${record.userId}_${recordDate}`;

    if (processedUserDates.has(userDateKey)) {
      successfulIds.push(record.id); // Acknowledge as success to remove from local queue
      continue;
    }

    // Check if attendance already exists in Firestore for this date
    const attendanceQuery = await db.collection("attendance_records")
      .where("userId", "==", record.userId)
      .where("date", "==", recordDate)
      .limit(1)
      .get();

    if (!attendanceQuery.empty) {
      successfulIds.push(record.id);
      processedUserDates.add(userDateKey);
      continue;
    }

    // Prepare new document
    const newDocRef = db.collection("attendance_records").doc();
    batch.set(newDocRef, {
      userId: record.userId,
      studentName: record.studentName,
      email: record.email,
      timestamp: FieldValue.serverTimestamp(),
      date: recordDate,
      status: "present",
      confidenceScore: record.confidenceScore || 0,
      offlineSynced: true,
      queuedAt: new Date(record.queuedAt),
    });

    successfulIds.push(record.id);
    processedUserDates.add(userDateKey);
  }

  await batch.commit();

  return NextResponse.json({
    success: true,
    syncedIds: successfulIds,
  });
}

export const POST = withErrorHandler(handleSync);
