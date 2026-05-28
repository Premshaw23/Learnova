import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest, parseJSON } from "@/lib/error-handler";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getWeekdaysSince } from "@/lib/dateUtils";

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);
  initFirebaseAdmin();
  const db = getFirestore();

  const statsDoc = await db.collection("userStats").doc(decodedToken.uid).get();

  if (!statsDoc.exists) {
    return jsonSuccess({ stats: null }, 200);
  }

  return jsonSuccess({ stats: { id: statsDoc.id, ...statsDoc.data() } }, 200);
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);
  const body = await parseJSON(request, 1024);
  const { action, statField, value } = body;

  initFirebaseAdmin();
  const db = getFirestore();
  const statsRef = db.collection("userStats").doc(decodedToken.uid);

  if (action === "initialize") {
    const defaultStats = {
      "Courses Enrolled": 0,
      "Attendance Rate": "0%",
      "Assignments Done": 0,
      "Study Hours": 0,
      lastUpdated: FieldValue.serverTimestamp(),
    };

    await statsRef.set(defaultStats);
    return jsonSuccess({ stats: defaultStats }, 201);
  }

  if (action === "update" && statField) {
    const ALLOWED_STAT_FIELDS = new Set([
      "Courses Enrolled",
      "Assignments Done",
      "Study Hours",
    ]);
    if (!ALLOWED_STAT_FIELDS.has(statField)) {
      return jsonError(
        `Invalid statField. Allowed values: ${[...ALLOWED_STAT_FIELDS].join(", ")}`,
        400
      );
    }

    const MAX_INCREMENT = 100;
    const rawIncrement = typeof value === "number" ? value : 1;
    if (!Number.isFinite(rawIncrement)) {
      return jsonError("value must be a finite number", 400);
    }
    const incValue = Math.max(-MAX_INCREMENT, Math.min(MAX_INCREMENT, rawIncrement));

    const statsSnap = await statsRef.get();
    if (!statsSnap.exists) {
      const defaultStats = {
        "Courses Enrolled": 0,
        "Attendance Rate": "0%",
        "Assignments Done": 0,
        "Study Hours": 0,
      };
      await statsRef.set(defaultStats);
    }

    await statsRef.update({
      [statField]: FieldValue.increment(incValue),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    return jsonSuccess({ success: true }, 200);
  }

  if (action === "recalculateAttendance") {
    const attendanceQuery = db
      .collection("attendance_records")
      .where("userId", "==", decodedToken.uid);

    const countSnapshot = await attendanceQuery.count().get();
    const presentDays = countSnapshot.data().count;

    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    let startDate = new Date(new Date().getFullYear(), 0, 1);
    if (userDoc.exists && userDoc.data().createdAt) {
      const createdAt = userDoc.data().createdAt;
      startDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    }

    const totalDays = getWeekdaysSince(startDate);
    const rate = Math.min(100, Math.round((presentDays / totalDays) * 100));

    await statsRef.set({}, { merge: true });
    await statsRef.update({
      "Attendance Rate": `${rate}%`,
      attendancePresentDays: presentDays,
      lastUpdated: FieldValue.serverTimestamp(),
    });

    return jsonSuccess({ rate }, 200);
  }

  return jsonError("Invalid action", 400);
});
