import { initFirebaseAdmin, getUserProfile } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { ForbiddenError } from "@/lib/errors";

export async function verifyParentStudentLink(parentId, studentId) {
  initFirebaseAdmin();
  const db = getFirestore();
  const linkId = `${parentId}_${studentId}`;
  const linkDoc = await db.collection("parent_student_links").doc(linkId).get();
  return linkDoc.exists;
}

export async function assertParentAccess(parentId, studentId) {
  const linked = await verifyParentStudentLink(parentId, studentId);
  if (!linked) {
    throw new ForbiddenError(
      "Access Denied: You are not authorized to view this student's records."
    );
  }
}

export async function assertStudentOwnership(requesterUid, studentId, role) {
  if (role === "admin") return;
  if (role === "student" && requesterUid !== studentId) {
    throw new ForbiddenError("Forbidden: You can only access your own achievements.");
  }
}

export async function assertInstituteScope(profile, studentId, role) {
  if (role === "admin") return;

  const student = await getUserProfile(studentId);
  if (!student) {
    throw new ForbiddenError("Student not found.");
  }

  const userInstituteId =
    profile?.instituteId || (profile?.role === "institute" ? profile?.uid : null);

  if (!userInstituteId) {
    throw new ForbiddenError(
      "Forbidden: User profile missing institute affiliation."
    );
  }

  if (student.instituteId !== userInstituteId) {
    throw new ForbiddenError(
      "Forbidden: You are not authorized to access records from another institute."
    );
  }
}

export async function getLinkedParentIds(studentId) {
  initFirebaseAdmin();
  const db = getFirestore();
  const linksQuery = await db
    .collection("parent_student_links")
    .where("studentId", "==", studentId)
    .get();

  return linksQuery.docs.map((doc) => doc.data().parentId).filter(Boolean);
}
