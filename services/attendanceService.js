import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebaseConfig";
import { recalculateAttendanceRate } from "./statsService";
import { saveToOutbox } from "@/lib/offlineStore";
import { registerBackgroundSync } from "@/lib/syncService";
import { getTodayKeyLocal } from "@/lib/dateUtils";

function getTodayKey() {
  return getTodayKeyLocal();
}

/**
 * Resolves the current open attendance session ID from Firestore.
 */
async function getActiveSessionId() {
  if (!db) return null;
  try {
    const sessionsRef = collection(db, "attendance_sessions");
    const q = query(
      sessionsRef, 
      where("isOpen", "==", true), 
      orderBy("createdAt", "desc"), 
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  } catch (error) {
    console.error("Failed to fetch active attendance session reference:", error);
    return null;
  }
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
 * Records attendance securely through backend API, incorporating Geofencing and Fingerprinting.
 * Fortified to intercept verified tokens passed directly down from the active scanner layer.
 */
export async function recordAttendance({
  userId,
  studentName,
  email,
  confidenceScore,
  deviceId,        // 🚀 Intercepting real-time device fingerprint hash token
  studentCoords,   // 🚀 Intercepting real-time GPS coordinate metrics object
}) {
  if (!userId || !db) {
    throw new Error("Attendance cannot be saved without a signed-in user.");
  }

  const todayKey = getTodayKey();

  const docRef = doc(
    db,
    "attendance_records",
    `${userId}_${todayKey}`
  );

  // 1. Resolve Active Session Identification
  const sessionId = await getActiveSessionId();
  if (!sessionId) {
    throw new Error("No active attendance sessions found for your institution. Ask your instructor to open attendance.");
  }

  // 2. Use passed fingerprint token or fallback to a string generation
  const finalDeviceFingerprint = deviceId || (typeof navigator !== "undefined" 
    ? `fallback_hash_${navigator.userAgent.replace(/\s+/g, '')}_${screen.width}x${screen.height}`
    : "unknown_hardware_node");

  // OFFLINE MODE COMPLIANCE LAYER
  if (typeof window !== "undefined" && !navigator.onLine) {
    console.warn("Device is offline. Queuing attendance locally with security tokens.");

    await saveToOutbox({
      userId,
      studentName,
      email,
      confidenceScore: confidenceScore ?? 0,
      date: todayKey,
      deviceFingerprint: finalDeviceFingerprint,
      sessionId,
      // 🎯 FIX: Persist cached coordinates when offline to allow back-end verification on delayed sync
      latitude: studentCoords?.latitude,
      longitude: studentCoords?.longitude,
      accuracy: studentCoords?.accuracy
    });

    await registerBackgroundSync();

    return {
      alreadyRecorded: false,
      newRate: null,
      queuedOffline: true,
    };
  }

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

  const response = await fetch("/api/attendance/record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId,
      studentName,
      email,
      confidenceScore: confidenceScore ?? 0,
      date: todayKey,
      sessionId,
      deviceFingerprint: finalDeviceFingerprint,
      // 🎯 FIX: Explicitly passing real-time verified location down to server router parameters
      latitude: studentCoords?.latitude,
      longitude: studentCoords?.longitude,
      accuracy: studentCoords?.accuracy
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to record attendance securely on the server.";

    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignore invalid JSON responses
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  const isAlreadyRecorded = !!(data && data.alreadyRecorded);

  const newRate = isAlreadyRecorded ? null : await recalculateAttendanceRate(userId);

  return {
    alreadyRecorded: isAlreadyRecorded,
    isFlagged: data?.isFlagged || false,
    flagReason: data?.flagReason || "NONE",
    status: data?.status || "present",
    newRate,
  };
}