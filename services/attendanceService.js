import {
  collection,
  addDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";

import { db } from "@/lib/firebaseConfig";

import { recalculateAttendanceRate } from "./statsService";
import { saveToOutbox } from "@/lib/offlineStore";
import { registerBackgroundSync } from "@/lib/syncService";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks whether a user has already recorded attendance for today.
 * @param {string} userId - The Firebase Auth user ID to check.
 * @returns {Promise<boolean>} True if the user has checked in today, false otherwise.
 * @example
 * const alreadyIn = await hasCheckedInToday('user_abc123');
 * if (alreadyIn) return true;
 */
export async function hasCheckedInToday(userId) {
  if (!userId || !db) {
    return false;
  }
  const today = getTodayKey();

  const attendanceQuery = query(
  collection(db, "attendance_records"),
  where("userId", "==", userId),
  where("date", "==", today),
  limit(1)
);

const snapshot = await getDocs(attendanceQuery);

return !snapshot.empty;
}

/**
 * Records a new attendance entry for a user if they have not already checked in today.
 * Also triggers a recalculation of the user's overall attendance rate.
 * @param {Object} params - Attendance parameters.
 * @param {string} params.userId - The Firebase Auth user ID.
 * @param {string} params.studentName - The student's full name.
 * @param {string} params.email - The student's email address.
 * @param {number} params.confidenceScore - Face-recognition confidence score (0 to 1).
 * @returns {Promise<{alreadyRecorded: boolean}>} Object indicating whether attendance was already recorded for today.
 * @throws {Error} If userId or db is unavailable.
 * @example
 * const result = await recordAttendance({
 *   userId: 'user_abc123',
 *   studentName: 'Alice Smith',
 *   email: 'alice@example.com',
 *   confidenceScore: 0.97,
 * });
 * // { alreadyRecorded: false }
 */
export async function recordAttendance({
  userId,
  studentName,
  email,
  confidenceScore,
}) {
  if (!userId || !db) {
    throw new Error("Attendance cannot be saved without a signed-in user.");
  }

  if (await hasCheckedInToday(userId)) {
    return { alreadyRecorded: true };
  }

  // INTERCEPT OFFLINE SUBMISSIONS
  if (typeof window !== "undefined" && !navigator.onLine) {
    console.warn("Device is offline. Queuing attendance locally.");
    await saveToOutbox({
      userId,
      studentName,
      email,
      confidenceScore: confidenceScore ?? 0,
      date: getTodayKey(),
    });
    
    // Attempt to register Background Sync for later flush
    await registerBackgroundSync();

    return { alreadyRecorded: false, newRate: null, queuedOffline: true };
  }

  await addDoc(collection(db, "attendance_records"), {
    userId,
    studentName,
    email,
    timestamp: serverTimestamp(),
    date: getTodayKey(),
    status: "present",
    confidenceScore: confidenceScore ?? 0,
  });

  const newRate = await recalculateAttendanceRate(userId);

  return { alreadyRecorded: false, newRate };
}
