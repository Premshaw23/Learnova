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
import fpPromise from "@fingerprintjs/fingerprintjs";

import { recalculateAttendanceRate } from "./statsService";
import { saveToOutbox } from "@/lib/offlineStore";
import { registerBackgroundSync } from "@/lib/syncService";
import { getTodayKeyLocal } from "@/lib/dateUtils";

function getTodayKey() {
  return getTodayKeyLocal();
}

/**
 * Utility helper to securely grab high-accuracy GPS coordinates from the browser.
 */
function getBrowserCoordinates() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by this browser."));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let msg = "Location access denied. Please enable GPS permissions to mark attendance.";
        if (error.code === error.TIMEOUT) msg = "Location request timed out. Try again.";
        if (error.code === error.POSITION_UNAVAILABLE) msg = "Location information is unavailable.";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true, // Force hardware GPS tracking
        timeout: 7000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Utility helper to fetch a unique hardware/browser fingerprint hash string.
 */
async function getDeviceHash() {
  try {
    const fp = await fpPromise.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error("Fingerprinting failed, generating fallback hash string", error);
    return `fallback_hash_${navigator.userAgent.replace(/\s+/g, '')}_${screen.width}x${screen.height}`;
  }
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

  // 2. Fetch Client Device Fingerprint Hash String
  const deviceFingerprint = await getDeviceHash();

  // 3. Collect Location Metrics (Only if browser reports online context status state)
  let coordinates = { latitude: undefined, longitude: undefined };
  if (typeof window !== "undefined" && navigator.onLine) {
    try {
      coordinates = await getBrowserCoordinates();
    } catch (geoError) {
      throw new Error(geoError.message);
    }
  }

  // OFFLINE MODE COMPLIANCE LAYER
  if (typeof window !== "undefined" && !navigator.onLine) {
    console.warn("Device is offline. Queuing attendance locally with security tokens.");

    await saveToOutbox({
      userId,
      studentName,
      email,
      confidenceScore: confidenceScore ?? 0,
      date: todayKey,
      deviceFingerprint,
      sessionId,
      // Note: Coordinates are omitted or kept undefined to protect data mapping constraints offline
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
      deviceFingerprint,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }),
  });

  if (!response.ok) {
    let errorMessage =
      "Failed to record attendance securely on the server.";

    try {
      const errorData = await response.json();

      if (errorData?.message) {
        errorMessage = errorData.message;
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