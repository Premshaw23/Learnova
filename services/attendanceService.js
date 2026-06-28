import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebaseConfig";

import { recalculateAttendanceRate } from "./statsService";
import { getTodayKeyLocal } from "@/lib/dateUtils";
import { queueOfflineAttendance, syncOfflineQueue } from "./offlineSyncQueue";

/**
 * Module-level async mutex for recordAttendance.
 * Serialises concurrent calls so only one HTTP request is in-flight at a time.
 * Any call that arrives while a request is in-flight waits for it to settle
 * before proceeding — this naturally surfaces the alreadyRecorded flag from
 * the Firestore duplicate check on the very next call.
 */
let _attendanceMutexChain = Promise.resolve();

/**
 * Wraps fn() in the module-level mutex chain.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
function withAttendanceMutex(fn) {
  // Append the new task to the tail of the chain, ensuring the next
  // invocation always waits for the current one to complete (or fail).
  const next = _attendanceMutexChain.then(fn, fn);
  // Update the chain pointer; errors must not break the chain for future calls.
  _attendanceMutexChain = next.then(
    () => {},
    () => {}
  );
  return next;
}

function getTodayKey() {
  return getTodayKeyLocal();
}

function unwrapApiData(payload) {
  return payload?.success === true && payload?.data !== undefined
    ? payload.data
    : payload;
}

function getApiErrorMessage(payload, fallback) {
  if (typeof payload?.error === "string") {
    return payload.error;
  }

  if (payload?.error?.message) {
    return payload.error.message;
  }

  return payload?.message || fallback;
}

/**
 * Checks whether a user has already recorded attendance for today.
 */
export async function hasCheckedInToday(userId) {
  if (!userId || !db) {
    return false;
  }

  try {
    const today = getTodayKey();

    const attendanceQuery = query(
      collection(db, "attendance_records"),
      where("userId", "==", userId),
      where("date", "==", today),
      limit(1)
    );

    const snapshot = await getDocs(attendanceQuery);

    return !snapshot.empty;
  } catch (error) {
    console.error("Failed to check attendance:", error);
    return false;
  }
}

/**
 * Records attendance securely through the backend API.
 *
 * Wrapped in a module-level async mutex (withAttendanceMutex) so that
 * concurrent calls — e.g. rapid button clicks or an offline-sync race —
 * are automatically serialised. Only one HTTP request is ever in-flight
 * at a time per browser tab.
 */
export function recordAttendance({
  userId,
  studentName,
  email,
  confidenceScore,
}) {
  return withAttendanceMutex(() =>
    _recordAttendanceImpl({ userId, studentName, email, confidenceScore })
  );
}

/**
 * Internal implementation — called exclusively through the mutex wrapper.
 * @private
 */
async function _recordAttendanceImpl({
  userId,
  studentName,
  email,
  confidenceScore,
}) {
  if (!userId || !db) {
    throw new Error("Attendance cannot be saved without a signed-in user.");
  }

  const todayKey = getTodayKey();
  const docRef = doc(db, "attendance_records", `${userId}_${todayKey}`);

  // Fast-path: Firestore client-side duplicate check (avoids an unnecessary
  // round-trip when the record already exists in local cache).
  const existingDoc = await getDoc(docRef);
  if (existingDoc.exists()) {
    console.info(
      `[AttendanceService] Duplicate blocked — attendance already recorded for ${userId} on ${todayKey}.`
    );
    return { alreadyRecorded: true };
  }

  // Obtain a fresh ID token for the server request
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Authentication token unavailable. Please sign in again.");
  }

  // ── OFFLINE PATH ──────────────────────────────────────────────────────────
  if (!navigator.onLine) {
    console.log(
      "[AttendanceService] Device is offline. Queuing attendance in IndexedDB."
    );
    await queueOfflineAttendance({
      userId,
      studentName,
      email,
      confidenceScore: confidenceScore ?? 0,
      date: todayKey,
    });
    return { alreadyRecorded: false, newRate: null, queuedOffline: true };
  }

  // ── ONLINE PATH ───────────────────────────────────────────────────────────
  let response;
  try {
    response = await fetch("/api/attendance/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        studentName,
        email,
        confidenceScore: confidenceScore ?? 0,
        date: todayKey,
      }),
    });
  } catch (networkError) {
    // Network error (no connectivity) — fall back to offline queue
    if (
      networkError.name === "TypeError" ||
      networkError.message?.includes("Failed to fetch")
    ) {
      console.warn(
        "[AttendanceService] Network error — queuing attendance to IndexedDB."
      );
      await queueOfflineAttendance({
        userId,
        studentName,
        email,
        confidenceScore: confidenceScore ?? 0,
        date: todayKey,
      });
      return { alreadyRecorded: false, newRate: null, queuedOffline: true };
    }
    throw networkError;
  }

  // HTTP 409 Conflict — backend detected a concurrent duplicate request
  if (response.status === 409) {
    console.info(
      `[AttendanceService] Backend returned 409 — duplicate request for ${userId} on ${todayKey}.`
    );
    return { alreadyRecorded: true };
  }

  if (!response.ok) {
    let errorMessage = "Failed to record attendance securely on the server.";
    try {
      const errorData = await response.json();
      errorMessage = getApiErrorMessage(errorData, errorMessage);
    } catch {
      // Ignore malformed JSON error bodies
    }
    throw new Error(errorMessage);
  }

  const data = unwrapApiData(await response.json());
  const isAlreadyRecorded = !!(data && data.alreadyRecorded);

  const newRate = isAlreadyRecorded
    ? null
    : await recalculateAttendanceRate(userId);

  return { alreadyRecorded: isAlreadyRecorded, newRate };
}
