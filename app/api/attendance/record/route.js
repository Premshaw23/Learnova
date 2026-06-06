import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdminConfig"; // Ensure you use Admin SDK or your authorized firestore db reference
import { getTodayKeyLocal } from "@/lib/dateUtils";

// Maximum allowable distance between student and professor in meters (e.g., classroom space bounds)
const GEOFENCE_RADIUS_METERS = 50; 

/**
 * Calculates the great-circle distance between two GPS coordinates
 * using the Haversine formula. Returns distance in meters.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

export async function POST(request) {
  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized. Missing token signature." }, { status: 401 });
    }
    
    const payload = await request.json();
    const {
      userId,
      studentName,
      email,
      confidenceScore,
      date,
      sessionId,
      deviceFingerprint,
      latitude,
      longitude,
    } = payload;

    if (!userId || !sessionId || !deviceFingerprint) {
      return NextResponse.json({ message: "Incomplete validation payload." }, { status: 400 });
    }

    // 2. Fetch Active Session Verification parameters (Instructor Coordinates)
    const sessionDocRef = db.collection("attendance_sessions").doc(sessionId);
    const sessionDoc = await sessionDocRef.get();

    if (!sessionDoc.exists || !sessionDoc.data().isOpen) {
      return NextResponse.json({ message: "This attendance session is no longer active." }, { status: 400 });
    }

    const sessionData = sessionDoc.data();
    const profLat = sessionData.latitude;
    const profLon = sessionData.longitude;

    // 3. Countermeasure A: Geofence Validation Check
    if (profLat !== undefined && profLon !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return NextResponse.json({ 
          message: "Geofencing verification failed. Location coordinates are required for this session." 
        }, { status: 400 });
      }

      const distance = calculateHaversineDistance(latitude, longitude, profLat, profLon);
      
      if (distance > GEOFENCE_RADIUS_METERS) {
        return NextResponse.json({ 
          message: `Location out of bounds. You are ${Math.round(distance)}m away from the classroom zone (Max: ${GEOFENCE_RADIUS_METERS}m).` 
        }, { status: 403 });
      }
    }

    // 4. Countermeasure B: Device Fingerprint Sharing Guard (Anti-Proxy Check)
    const todayKey = date || getTodayKeyLocal();
    const recordsRef = db.collection("attendance_records");
    
    const proxyQuery = await recordsRef
      .where("date", "==", todayKey)
      .where("deviceFingerprint", "==", deviceFingerprint)
      .get();

    // Check if this physical device signature has logged a DIFFERENT account today
    const structuralProxyDetected = proxyQuery.docs.some(
      (doc) => doc.data().userId !== userId
    );

    if (structuralProxyDetected) {
      return NextResponse.json({ 
        message: "Security Flag: This device has already registered attendance for another student today." 
      }, { status: 403 });
    }

    // 5. Commit Secure Attendance Document
    const recordId = `${userId}_${todayKey}`;
    const targetRecordRef = recordsRef.doc(recordId);
    const existingRecord = await targetRecordRef.get();

    if (existingRecord.exists) {
      return NextResponse.json({ alreadyRecorded: true }, { status: 200 });
    }

    const attendanceWritePayload = {
      userId,
      studentName,
      email,
      confidenceScore,
      date: todayKey,
      sessionId,
      deviceFingerprint,
      latitude,
      longitude,
      status: "present",
      isFlagged: false,
      flagReason: "NONE",
      timestamp: new Date().toISOString(),
    };

    await targetRecordRef.set(attendanceWritePayload);

    return NextResponse.json({
      alreadyRecorded: false,
      status: "present",
      isFlagged: false,
      flagReason: "NONE"
    }, { status: 201 });

  } catch (error) {
    console.error("Critical server-side attendance registration exception:", error);
    return NextResponse.json({ message: "Internal application processing error." }, { status: 500 });
  }
}