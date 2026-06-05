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
import {
  handleOfflineRequest,
  triggerOfflineSync,
} from "@/utils/offlineRequestHandler";
import { getTodayKeyLocal } from "@/lib/dateUtils";

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
 * Records attendance securely through backend API.
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

  const todayKey = getTodayKey();

  const docRef = doc(db, "attendance_records", `${userId}_${todayKey}`);

  // OFFLINE MODE check removed. Workbox Background Sync handles it automatically.

  // DUPLICATE CHECK
  const existingDoc = await getDoc(docRef);

  if (existingDoc.exists()) {
    return {
      alreadyRecorded: true,
    };
  }

  // SECURE SERVER RECORDING
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Authentication token unavailable. Please sign in again.");
  }

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
  } catch (error) {
    // If it's a network error, Workbox Background Sync has queued the request
    if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
      console.warn("Network error during attendance submission. Workbox will sync later.");
      return {
        alreadyRecorded: false,
        newRate: null,
        queuedOffline: true,
      };
    }
    throw error;
  }

  if (!response.ok) {
    let errorMessage = "Failed to record attendance securely on the server.";

    try {
      const errorData = await response.json();
      errorMessage = getApiErrorMessage(errorData, errorMessage);
    } catch {
      // Ignore invalid JSON responses
    }

    throw new Error(errorMessage);
  }

  const data = unwrapApiData(await response.json());
  const isAlreadyRecorded = !!(data && data.alreadyRecorded);

  const newRate = isAlreadyRecorded
    ? null
    : await recalculateAttendanceRate(userId);

  return {
    alreadyRecorded: isAlreadyRecorded,
    newRate,
  };
}
