import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireParent, requireRole } from "@/lib/rbac";
import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SAMPLE_GRADES = [
  {
    subject: "Mathematics",
    grade: "A",
    score: 92,
    maxScore: 100,
    term: "Midterm",
    date: "2026-03-15",
  },
  {
    subject: "Computer Science",
    grade: "A+",
    score: 98,
    maxScore: 100,
    term: "Midterm",
    date: "2026-03-18",
  },
  {
    subject: "Physics",
    grade: "B+",
    score: 87,
    maxScore: 100,
    term: "Midterm",
    date: "2026-03-20",
  },
  {
    subject: "Chemistry",
    grade: "A-",
    score: 90,
    maxScore: 100,
    term: "Midterm",
    date: "2026-03-22",
  },
  {
    subject: "English Literature",
    grade: "B",
    score: 78,
    maxScore: 100,
    term: "Midterm",
    date: "2026-03-25",
  },
];

export const GET = withErrorHandler(async (request, context) => {
  const { payload: decodedToken } = await requireParent(request);
  const parentId = decodedToken.uid;
  const { studentId } = context.params;

  initFirebaseAdmin();
  const db = getFirestore();

  // 1. Verify parent-student linking relationship
  const linkId = `${parentId}_${studentId}`;
  const linkDoc = await db.collection("parent_student_links").doc(linkId).get();
  if (!linkDoc.exists) {
    return jsonError(
      "Access Denied: You are not authorized to view this student's records.",
      403
    );
  }

  // 2. Query student grades
  const gradesQuery = await db
    .collection("grades")
    .where("studentId", "==", studentId)
    .get();

  let grades = [];

  if (gradesQuery.empty) {
    // No real grades exist yet. Return sample data for display purposes only.
    // Do NOT persist sample records to Firestore or MongoDB. Writing demo data
    // to the production database on first access creates permanent stub records
    // that mix with real grades on subsequent queries, producing duplicate or
    // misleading academic data that cannot be easily cleaned up.
    grades = SAMPLE_GRADES.map((g, i) => ({
      id: `sample_${i}`,
      studentId,
      ...g,
      isSample: true,
    }));
  } else {
    grades = gradesQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Sort grades by subject name
  grades.sort((a, b) => a.subject.localeCompare(b.subject));

  return jsonSuccess({ grades }, 200);
});

export const POST = withErrorHandler(async (request, context) => {
  // Let admins or teachers add grades
  const { payload: decodedToken, profile } = await requireRole(request, [
    "admin",
    "teacher",
  ]);
  const body = await parseJSON(request, 1024 * 5);
  const { studentId, subject, grade, score, maxScore, term, date } = body;

  if (!studentId || !subject || !grade || score === undefined) {
    return jsonError("Missing required grade fields", 400);
  }

  let routeStudentId = context?.params?.studentId;
  if (!routeStudentId && request.url) {
    const match = request.url.match(/\/student\/([^/]+)\/grades/);
    if (match) {
      routeStudentId = match[1];
    }
  }

  const targetStudentId = routeStudentId || studentId;

  const student = await getUserProfile(targetStudentId);
  if (!student) {
    return jsonError("Student not found", 404);
  }
  if (student.role !== "student") {
    return jsonError("Target user is not a student", 400);
  }

  if (routeStudentId && studentId !== routeStudentId) {
    return jsonError("Student ID mismatch in request path and body", 400);
  }

  const userInstituteId =
    profile?.instituteId ||
    (profile?.role === "institute" ? profile?.uid : null);

  if (userInstituteId) {
    if (student.instituteId !== userInstituteId) {
      return jsonError(
        "Forbidden: You are not authorized to access records from another institute.",
        403
      );
    }
  } else if (profile?.role !== "admin") {
    return jsonError(
      "Forbidden: User profile missing institute affiliation.",
      403
    );
  }

  initFirebaseAdmin();
  const db = getFirestore();

  const newGrade = {
    studentId,
    subject,
    grade,
    score: Number(score),
    maxScore: Number(maxScore || 100),
    term: term || "General",
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };

  const result = await db.collection("grades").add(newGrade);

  try {
    const mongoDb = await connectDb();
    await mongoDb
      .collection("grades")
      .updateOne(
        { _id: result.id },
        { $set: { ...newGrade, _id: result.id } },
        { upsert: true }
      );
  } catch (err) {
    console.error("MongoDB grade sync failed:", err);
  }

  // Notify parent if linked
  try {
    const linksQuery = await db
      .collection("parent_student_links")
      .where("studentId", "==", studentId)
      .get();

    for (const doc of linksQuery.docs) {
      const parentId = doc.data().parentId;
      await db.collection("notifications").add({
        recipientId: parentId,
        studentId,
        message: `Academic Update: A new grade (${grade} in ${subject}) has been posted for your child.`,
        type: "grade_update",
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  } catch (notifyErr) {
    console.error("Failed to create parent grade notification:", notifyErr);
  }

  return jsonSuccess({ success: true, id: result.id, grade: newGrade }, 201);
});
