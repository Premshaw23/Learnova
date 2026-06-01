import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getWeekdaysSince } from "@/lib/dateUtils";

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  initFirebaseAdmin();
  const db = getFirestore();

  const statsDoc = await db.collection("userStats").doc(decodedToken.uid).get();

  if (!statsDoc.exists) {
    return jsonSuccess({ stats: null }, 200);
  }

  return jsonSuccess({ stats: { id: statsDoc.id, ...statsDoc.data() } }, 200);
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const body = await parseJSON(request, 1024);
  const { action } = body;

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

  if (action === "recalculateAll") {
    // Server-side derived stats: compute from actual activity data
    // Courses Enrolled: count from enrollments collection
    let coursesEnrolled = 0;
    try {
      const coursesSnap = await db
        .collection("enrollments")
        .where("userId", "==", decodedToken.uid)
        .count()
        .get();
      coursesEnrolled = coursesSnap.data().count || 0;
    } catch {}

    // Assignments Done: count from submissions
    let assignmentsDone = 0;
    try {
      const assignmentsSnap = await db
        .collection("submissions")
        .where("userId", "==", decodedToken.uid)
        .count()
        .get();
      assignmentsDone = assignmentsSnap.data().count || 0;
    } catch {}

    // Attendance rate: derived from attendance_records
    let attendanceRate = "0%";
    try {
      const attendanceQuery = db
        .collection("attendance_records")
        .where("userId", "==", decodedToken.uid);
      const attendanceCount = await attendanceQuery.count().get();
      const presentDays = attendanceCount.data().count || 0;

      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      let startDate = new Date(new Date().getFullYear(), 0, 1);
      if (userDoc.exists && userDoc.data().createdAt) {
        const createdAt = userDoc.data().createdAt;
        startDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      }
      const totalDays = getWeekdaysSince(startDate);
      const rate = Math.min(100, Math.round((presentDays / totalDays) * 100));
      attendanceRate = `${rate}%`;
    } catch {}

    await statsRef.set({
      "Courses Enrolled": coursesEnrolled,
      "Assignments Done": assignmentsDone,
      "Attendance Rate": attendanceRate,
      "Study Hours": 0,
      lastUpdated: FieldValue.serverTimestamp(),
    });

    return jsonSuccess({ stats: { "Courses Enrolled": coursesEnrolled, "Assignments Done": assignmentsDone, "Attendance Rate": attendanceRate } }, 200);
  }

  return jsonError("Invalid action", 400);
});
