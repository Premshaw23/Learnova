import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest, parseJSON } from "@/lib/error-handler";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { awardXp } from "@/lib/gamification-service";
import { getLocalDateKey } from "@/lib/dateUtils";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";

/**
 * Calculates the great-circle distance between two coordinates in meters using the Haversine formula
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_record_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 2048); // Increased slightly to safely accommodate geolocation & fingerprint strings
  const { 
    userId, 
    confidenceScore, 
    date, 
    latitude, 
    longitude, 
    deviceFingerprint, 
    sessionId 
  } = body;
  
  const normalizedDate = (date || getLocalDateKey()).toString();

  // 1. Ensure they are only submitting attendance for their own UID!
  if (decodedToken.uid !== userId) {
    return jsonError("Forbidden: Cannot submit attendance for another user", 403);
  }

  // 2. Ensure device fingerprint and session identifier exist in payload
  if (!deviceFingerprint || typeof deviceFingerprint !== "string") {
    return jsonError("Bad Request: Missing or invalid device fingerprint configuration", 400);
  }
  if (!sessionId) {
    return jsonError("Bad Request: Missing required active session identification token", 400);
  }

  // 3. Ensure they actually matched the face threshold (60 is the minimum configured in the frontend)
  const parsedConfidence = Number(confidenceScore);
  if (
    confidenceScore === undefined ||
    confidenceScore === null ||
    Number.isNaN(parsedConfidence) ||
    parsedConfidence < 60 ||
    parsedConfidence > 100
  ) {
    return jsonError("Bad Request: Invalid or spoofed confidence score", 400);
  }

  const normalizedConfidence = parsedConfidence / 100;

  initFirebaseAdmin();
  const db = getFirestore();
  const userProfile = await getUserProfile(decodedToken.uid);
  const instituteId = userProfile?.instituteId || null;

  const resolvedName = userProfile?.fullName || decodedToken.name || decodedToken.displayName || decodedToken.email?.split("@")[0] || "Unknown User";
  const resolvedEmail = userProfile?.email || decodedToken.email || "unknown@learnova.edu";

  // Fetch active instructor session data to extract geofencing references
  const sessionDocRef = db.collection("attendance_sessions").doc(sessionId);
  const sessionDoc = await sessionDocRef.get();

  if (!sessionDoc.exists || !sessionDoc.data().isOpen) {
    return jsonError("Bad Request: Target attendance verification session is expired or closed", 400);
  }

  const sessionData = sessionDoc.data();
  const teacherLat = sessionData.teacherLatitude;
  const teacherLon = sessionData.teacherLongitude;
  const allowedRadius = sessionData.allowedRadius || 50; // default boundary check fallback fallback to 50 meters

  // Geofencing Evaluation
  let isWithinRange = false;
  if (latitude !== undefined && longitude !== undefined) {
    const studentDistance = calculateHaversineDistance(
      Number(latitude),
      Number(longitude),
      Number(teacherLat),
      Number(teacherLon)
    );
    isWithinRange = studentDistance <= allowedRadius;
  }

  const docRef = db.collection("attendance_records").doc(`${userId}_${normalizedDate}`);

  let alreadyRecorded = false;
  let flagDetected = false;
  let detectedFlagReason = "NONE";
  let targetStatus = "present";

  // Evaluate structural baseline validation variables
  if (!isWithinRange) {
    flagDetected = true;
    detectedFlagReason = "OUT_OF_BOUNDS";
    targetStatus = "pending_review";
  }

  await db.runTransaction(async (transaction) => {
    const existingDoc = await transaction.get(docRef);
    if (existingDoc.exists) {
      alreadyRecorded = true;
      return;
    }

    // Proxy Fraud Check: Look up if another user has already asserted a claim utilizing this hardware fingerprint config
    const duplicateFingerprintCheck = await db.collection("attendance_records")
      .where("date", "==", normalizedDate)
      .where("deviceFingerprint", "==", deviceFingerprint)
      .limit(1)
      .get();

    if (!duplicateFingerprintCheck.empty) {
      flagDetected = true;
      detectedFlagReason = "DUPLICATE_FINGERPRINT";
      targetStatus = "pending_review";

      // Flag the original student record that established this hardware block mapping session too
      const originalRecordDoc = duplicateFingerprintCheck.docs[0];
      transaction.update(originalRecordDoc.ref, {
        isFlagged: true,
        flagReason: "DUPLICATE_FINGERPRINT",
        status: "pending_review"
      });
    }

    // Write database log mapping payload parameters securely (omitting coordinate storage for privacy compliance)
    transaction.set(
      docRef,
      {
        userId,
        studentName: resolvedName,
        email: resolvedEmail,
        instituteId,
        sessionId,
        timestamp: FieldValue.serverTimestamp(),
        date: normalizedDate,
        status: targetStatus,
        confidenceScore: normalizedConfidence,
        offlineSynced: false,
        deviceFingerprint,
        isWithinRange,
        isFlagged: flagDetected,
        flagReason: detectedFlagReason,
      },
      { merge: true },
    );
  });

  if (alreadyRecorded) {
    return jsonSuccess({ alreadyRecorded: true }, 200);
  }

  // Gamification is a side effect — failures or status flags must not block server execution response loops
  if (!flagDetected) {
    try {
      await awardXp(userId, "attendance_marked", {
        attendanceHour: new Date().getHours(),
      });
    } catch (error) {
      console.error("Failed to award XP after attendance:", error);
    }
  }

  return jsonSuccess({ 
    alreadyRecorded: false,
    isFlagged: flagDetected,
    flagReason: detectedFlagReason,
    status: targetStatus 
  }, 201);
});