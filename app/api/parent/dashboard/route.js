import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireParent } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireParent(request);
  const parentId = decodedToken.uid;

  initFirebaseAdmin();
  const db = getFirestore();

  // Find linked student IDs
  const linksSnap = await db
    .collection("parent_student_links")
    .where("parentId", "==", parentId)
    .get();

  const students = [];

  for (const docRef of linksSnap.docs) {
    const link = docRef.data();
    const studentId = link.studentId;

    // Fetch student profile
    const studentDoc = await db.collection("users").doc(studentId).get();
    if (!studentDoc.exists) continue;

    const studentProfile = studentDoc.data();
    const studentName =
      studentProfile.fullName || studentProfile.name || "Student";
    const instituteId = studentProfile.instituteId || "N/A";

    // Fetch student overall stats (like attendance rate)
    const statsDoc = await db.collection("userStats").doc(studentId).get();
    const stats = statsDoc.exists ? statsDoc.data() : {};
    const attendanceRateStr = stats["Attendance Rate"] || "0%";
    const attendanceRate =
      parseInt(attendanceRateStr.replace("%", ""), 10) || 0;

    // Fetch recent 3 notices for the student's institute
    let notices = [];
    if (instituteId !== "N/A") {
      const noticesQuery = await db
        .collection("notices")
        .where("instituteId", "==", instituteId)
        .where("targetAudience", "array-contains-any", ["student", "parent"])
        .orderBy("createdAt", "desc")
        .limit(3)
        .get();

      notices = noticesQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      }));
    }

    // Fetch grades to check general standing
    const gradesSnap = await db
      .collection("grades")
      .where("studentId", "==", studentId)
      .get();

    const grades = gradesSnap.docs.map((doc) => doc.data());
    const gpa =
      grades.length > 0
        ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(
            1
          )
        : "N/A";

    // Self-healing check: Trigger low-attendance notification if rate is below 75%
    if (attendanceRate < 75) {
      // Check if alert already exists within the last 24 hours
      const oneDayAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const existingAlerts = await db
        .collection("notifications")
        .where("recipientId", "==", parentId)
        .where("studentId", "==", studentId)
        .where("type", "==", "low_attendance")
        .where("createdAt", ">=", oneDayAgo)
        .limit(1)
        .get();

      if (existingAlerts.empty) {
        await db.collection("notifications").add({
          recipientId: parentId,
          studentId,
          message: `Alert: ${studentName}'s attendance has dropped to ${attendanceRateStr}, which is below the 75% required threshold.`,
          type: "low_attendance",
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }

    students.push({
      uid: studentId,
      name: studentName,
      email: studentProfile.email,
      rollNo: studentProfile.rollNo || studentProfile.studentId || "N/A",
      instituteId,
      attendanceRate: attendanceRateStr,
      gpa,
      recentNotices: notices,
    });
  }

  return jsonSuccess({ students }, 200);
});
