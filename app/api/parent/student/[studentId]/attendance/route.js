import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireParent } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Accepted studentId pattern: Firebase UIDs are 28-character alphanumeric strings.
// Reject values that do not conform to prevent path manipulation and enumeration.
const STUDENT_ID_RE = /^[A-Za-z0-9_-]{8,128}$/;

export const GET = withErrorHandler(async (request, context) => {
  const { payload: decodedToken } = await requireParent(request);
  const parentId = decodedToken.uid;
  const { studentId } = context.params;

  // Validate studentId format before issuing any database query.
  // Accepting arbitrary strings allows a caller to enumerate IDs by
  // making repeated requests with different values and observing the
  // 403 vs 200 response difference. Rejecting malformed IDs early also
  // prevents special characters from being used in Firestore document paths.
  if (!studentId || !STUDENT_ID_RE.test(studentId)) {
    return jsonError("Invalid student ID format.", 400);
  }

  initFirebaseAdmin();
  const db = getFirestore();

  // 1. Verify parent-student linking relationship.
  // parentId is derived from the authenticated Firebase token, not from
  // the request body, so it cannot be spoofed by the caller.
  const linkId = `${parentId}_${studentId}`;
  const linkDoc = await db.collection("parent_student_links").doc(linkId).get();
  if (!linkDoc.exists) {
    return jsonError(
      "Access Denied: You are not authorized to view this student's records.",
      403
    );
  }

  // 2. Query student attendance records
  const recordsQuery = await db
    .collection("attendance_records")
    .where("userId", "==", studentId)
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

  return jsonSuccess(
    {
      stats: {
        total: presentCount + lateCount + absentCount,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendancePercentage:
          presentCount + lateCount + absentCount > 0
            ? Math.round(
                ((presentCount + lateCount) /
                  (presentCount + lateCount + absentCount)) *
                  100
              )
            : 0,
      },
      records,
    },
    200
  );
});
