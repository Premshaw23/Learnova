import { jsonError, jsonSuccess } from "@/lib/api-response";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { connectDb } from "@/lib/mongodb";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { calculateEngagementScore, getEngagementCategory, DEFAULT_ENGAGEMENT_WEIGHTS } from "@/lib/engagementScore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = async (request) => {
  const cronAuth = authorizeCronRequest(request);
  if (!cronAuth.authorized) {
    return cronAuth.response;
  }

  try {
    const db = await connectDb();
    initFirebaseAdmin();
    const firestore = getFirestore();

    // Fetch all students from MongoDB
    const students = await db
      .collection("users")
      .find({ role: "student" })
      .toArray();

    const now = new Date();
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);

    let processed = 0;
    const errors = [];

    for (const student of students) {
      const studentId = student.firebaseUid || student.uid || student._id.toString();

      try {
        // 1. Calculate Attendance Score (last 28 days)
        const attendanceRecords = await db
          .collection("attendance")
          .find({
            userId: studentId,
            date: { $gte: fourWeeksAgo.toISOString().slice(0, 10) },
          })
          .toArray();

        const totalAttendance = attendanceRecords.length;
        const presentAttendance = attendanceRecords.filter((r) =>
          ["present", "late"].includes(r.status)
        ).length;

        const attendanceScore = totalAttendance === 0 ? 100 : (presentAttendance / totalAttendance) * 100;

        // 2. Fetch Firestore activities for student
        const snapshot = await firestore
          .collection("activities")
          .where("userId", "==", studentId)
          .get();

        const activities = snapshot.docs.map((doc) => doc.data());

        const courseAndQuizActivities = activities.filter((act) =>
          ["course", "quiz"].includes(act.type)
        );
        const activityScore =
          courseAndQuizActivities.length === 0
            ? 0
            : courseAndQuizActivities.reduce((acc, curr) => acc + (curr.progress || 0), 0) /
              courseAndQuizActivities.length;

        const assignmentActivities = activities.filter((act) => act.type === "assignment");
        const assignmentScore =
          assignmentActivities.length === 0
            ? 0
            : assignmentActivities.reduce((acc, curr) => acc + (curr.progress || 0), 0) /
              assignmentActivities.length;

        const quizActivities = activities.filter((act) => act.type === "quiz");
        const academicScore =
          quizActivities.length === 0
            ? 0
            : quizActivities.reduce((acc, curr) => acc + (curr.progress || 0), 0) / quizActivities.length;

        // 3. Fetch Institute Weights
        const settings = await db
          .collection("settings")
          .findOne({ userId: student.instituteId });
        const weights = settings?.institute?.engagementWeights || DEFAULT_ENGAGEMENT_WEIGHTS;

        // 4. Compute Engagement Score
        const scorePayload = calculateEngagementScore(
          { attendanceScore, activityScore, assignmentScore, academicScore },
          weights
        );

        const record = {
          studentId,
          studentName: student.name || "Student",
          email: student.email || "",
          attendanceScore: scorePayload.attendanceScore,
          activityScore: scorePayload.activityScore,
          assignmentScore: scorePayload.assignmentScore,
          academicScore: scorePayload.academicScore,
          overallScore: scorePayload.overallScore,
          category: getEngagementCategory(scorePayload.overallScore),
          weights: scorePayload.weights,
          calculatedAt: now,
        };

        // 5. Save/Upsert Daily Score
        await db.collection("engagement_scores").insertOne(record);
        processed++;
      } catch (err) {
        errors.push({ studentId, error: err.message });
      }
    }

    return jsonSuccess({
      message: "Daily engagement scoring recalculation complete",
      processed,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      ranAt: now.toISOString(),
    });
  } catch (err) {
    return jsonError(`Cron job failed: ${err.message}`, 500);
  }
};
