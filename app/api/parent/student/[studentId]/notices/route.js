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

  // 2. Fetch student profile to get instituteId
  const studentDoc = await db.collection("users").doc(studentId).get();
  if (!studentDoc.exists) {
    return jsonError("Student profile not found", 404);
  }

  const studentProfile = studentDoc.data();
  const instituteId = studentProfile.instituteId;

  if (!instituteId) {
    return jsonSuccess({ notices: [] }, 200);
  }

  // 3. Query notices for student's institute, filtered by target audience
  const noticesQuery = await db
    .collection("notices")
    .where("instituteId", "==", instituteId)
    .where("targetAudience", "array-contains-any", ["student", "parent"])
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const notices = noticesQuery.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
  }));

  return jsonSuccess({ notices }, 200);
});
