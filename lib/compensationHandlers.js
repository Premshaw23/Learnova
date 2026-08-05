import { registerCompensation } from "@/lib/compensationRegistry";
import { getFirestore } from "firebase-admin/firestore";
import { connectDb } from "@/lib/mongodb";

/**
 * Compensation handlers for saga operations, keyed by operationType +
 * compensateKey. Registered at module load so the reconciliation job can
 * dispatch compensation for committed steps purely from persisted state.
 *
 * Attendance record compensations are derived from the deterministic
 * idempotency key (`attendance:${userId}:${date}`) — no in-memory context is
 * required, which is exactly what a stuck saga needs.
 */

function parseAttendanceOperationId(operationId) {
  const parts = String(operationId || "").split(":");
  if (parts.length < 3 || parts[0] !== "attendance") return null;
  return { userId: parts[1], date: parts.slice(2).join(":") };
}

registerCompensation(
  "attendance_record",
  "attendance_firestore",
  async ({ operationId }) => {
    const parts = parseAttendanceOperationId(operationId);
    if (!parts) return;
    const db = getFirestore();
    await db
      .collection("attendance_records")
      .doc(`${parts.userId}_${parts.date}`)
      .delete();
  }
);

registerCompensation(
  "attendance_record",
  "attendance_mongodb",
  async ({ operationId }) => {
    const parts = parseAttendanceOperationId(operationId);
    if (!parts) return;
    const mongoDB = await connectDb();
    await mongoDB.collection("attendance").deleteOne({
      userId: parts.userId,
      date: parts.date,
    });
  }
);
