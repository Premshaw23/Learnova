import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireParent } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withErrorHandler(async (request, context) => {
  const { payload: decodedToken } = await requireParent(request);
  const parentId = decodedToken.uid;
  const { studentId } = context.params;

  // Early validation: Immediately verify input parameters before any processing
  if (!studentId || typeof studentId !== "string" || studentId.trim() === "") {
    return jsonError("Invalid student ID provided.", 400);
  }

  // Prevent empty or whitespace-only IDs
  const sanitizedStudentId = studentId.trim();
  if (sanitizedStudentId.length === 0) {
    return jsonError("Invalid student ID provided.", 400);
  }

  initFirebaseAdmin();
  const db = getFirestore();

  // CRITICAL: Verify parent-student linking relationship IMMEDIATELY
  // This authorization check must happen before any data access to prevent IDOR
  // Do not proceed with any queries until ownership is verified
  const linkId = `${parentId}_${sanitizedStudentId}`;
  const linkDoc = await db.collection("parent_student_links").doc(linkId).get();

  if (!linkDoc.exists) {
    // Return 403 without exposing whether student exists or parent-student relationship exists
    return jsonError("Access Denied: You are not authorized to view this student's records.", 403);
  }

  // 2. Query student attendance records (only after authorization is verified)
  const recordsQuery = await db
    .collection("attendance_records")
    .where("userId", "==", sanitizedStudentId)
    .get();

  const records = [];
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  recordsQuery.docs.forEach((doc) => {
    const data = doc.data();
    const status = data.status || "present"; // Defaults to present if status omitted

    if (status === "present") presentCount++;
    else if (status === "late") lateCount++;
    else if (status === "absent") absentCount++;

    records.push({
      id: doc.id,
      date: data.date,
      status,
      confidenceScore: data.confidenceScore ?? 1.0,
      timestamp: data.timestamp?.toDate?.() || data.timestamp,
    });
  });

  // Sort records by date descending
  records.sort((a, b) => new Date(b.date) - new Date(a.date));

  return jsonSuccess({
    stats: {
      total: presentCount + lateCount + absentCount,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      attendancePercentage: (presentCount + lateCount + absentCount) > 0
        ? Math.round(((presentCount + lateCount) / (presentCount + lateCount + absentCount)) * 100)
        : 0,
    },
    records,
  }, 200);
});
