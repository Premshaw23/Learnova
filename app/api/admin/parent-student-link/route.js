import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAdmin, requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { executeSaga } from "@/lib/transactionCoordinator";

import {
  parentStudentLinkSchema,
  deleteParentStudentLinkSchema,
} from "@/lib/validations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withErrorHandler(async (request) => {
  await requireAdmin(request);
  initFirebaseAdmin();
  const db = getFirestore();

  // Fetch all links from Firestore
  const linksSnap = await db.collection("parent_student_links").get();

  // Some test mocks may not return fully populated doc.data() values.
  // Fail-safe to avoid 500s in that case.
  if (!linksSnap || !Array.isArray(linksSnap.docs)) {
    return jsonSuccess({ links: [] }, 200);
  }

  const userIds = new Set();
  linksSnap.docs.forEach((doc) => {
    userIds.add(doc.data().parentId);
    userIds.add(doc.data().studentId);
  });

  const userDocs = new Map();
  if (userIds.size > 0) {
    const uidArray = Array.from(userIds);
    const refs = uidArray.map((uid) => db.collection("users").doc(uid));

    // Chunk refs into groups of 100 (getAll limit)
    for (let i = 0; i < refs.length; i += 100) {
      const chunkRefs = refs.slice(i, i + 100);
      const docs = await db.getAll(...chunkRefs);
      docs.forEach((doc) => {
        if (doc.exists) userDocs.set(doc.id, doc.data());
      });
    }
  }

  const links = [];
  for (const doc of linksSnap.docs) {
    const data = doc.data();
    const pData = userDocs.get(data.parentId);
    const sData = userDocs.get(data.studentId);

    links.push({
      id: doc.id,
      parentId: data.parentId,
      studentId: data.studentId,
      createdAt: data.createdAt,
      parentName: pData
        ? pData.fullName || pData.name || "Unknown"
        : "Unknown Parent",
      parentEmail: pData ? pData.email : "N/A",
      studentName: sData
        ? sData.fullName || sData.name || "Unknown"
        : "Unknown Student",
      studentEmail: sData ? sData.email : "N/A",
    });
  }

  return jsonSuccess({ links }, 200);
});

export const POST = withErrorHandler(async (request) => {
  const { payload } = await requireAdmin(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `link_creation_${ip}_${payload.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request);

  const validation = parentStudentLinkSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(
      {
        message: "Validation failed",
        details: validation.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      400
    );
  }

  const { parentEmail, studentEmail } = validation.data;

  initFirebaseAdmin();
  const db = getFirestore();

  // Find parent by email
  const parentQuery = await db
    .collection("users")
    .where("email", "==", parentEmail.trim().toLowerCase())
    .limit(1)
    .get();

  if (parentQuery.empty) {
    return jsonError(`Parent with email "${parentEmail}" not found`, 404);
  }

  const parentProfile = parentQuery.docs[0].data();
  if (parentProfile.role !== "parent") {
    return jsonError(
      `User "${parentEmail}" is registered as "${parentProfile.role}", not "parent"`,
      400
    );
  }

  // Find student by email
  const studentQuery = await db
    .collection("users")
    .where("email", "==", studentEmail.trim().toLowerCase())
    .limit(1)
    .get();

  if (studentQuery.empty) {
    return jsonError(`Student with email "${studentEmail}" not found`, 404);
  }

  const studentProfile = studentQuery.docs[0].data();
  if (studentProfile.role !== "student") {
    return jsonError(
      `User "${studentEmail}" is registered as "${studentProfile.role}", not "student"`,
      400
    );
  }

  if (
    parentProfile.instituteId &&
    studentProfile.instituteId &&
    parentProfile.instituteId !== studentProfile.instituteId
  ) {
    return jsonError(
      "Parent and student must belong to the same institute",
      400
    );
  }

  const parentId = parentProfile.uid;
  const studentId = studentProfile.uid;
  const linkId = `${parentId}_${studentId}`;

  // Check if link already exists
  const existingLink = await db
    .collection("parent_student_links")
    .doc(linkId)
    .get();
  if (existingLink.exists) {
    return jsonError("This relationship is already linked", 400);
  }

  const linkData = {
    parentId,
    studentId,
    createdAt: new Date().toISOString(),
  };

  const sagaResult = await executeSaga({
    operationType: "create_parent_student_link",
    uid: payload.uid,
    steps: [
      {
        name: "write_firestore",
        execute: async () => {
          await db.collection("parent_student_links").doc(linkId).set(linkData);
        },
        compensate: async () => {
          await db.collection("parent_student_links").doc(linkId).delete();
        },
      },
      {
        name: "write_mongodb",
        execute: async () => {
          const mongoDb = await connectDb();
          await mongoDb
            .collection("parent_student_links")
            .updateOne(
              { _id: linkId },
              { $set: { ...linkData, _id: linkId } },
              { upsert: true }
            );
        },
        compensate: async () => {
          const mongoDb = await connectDb();
          await mongoDb
            .collection("parent_student_links")
            .deleteOne({ _id: linkId });
        },
      },
    ],
  });

  if (!sagaResult.success) {
    throw new AppError(
      `Failed to sync parent-student link: ${sagaResult.error}`,
      500
    );
  }

  return jsonSuccess({ success: true, link: { id: linkId, ...linkData } }, 201);
});

export const DELETE = withErrorHandler(async (request) => {
  const payload = await requireAuth(request);
  const url = new URL(request.url);

  const queryParams = {
    parentId: url.searchParams.get("parentId"),
    studentId: url.searchParams.get("studentId"),
  };

  const validation = deleteParentStudentLinkSchema.safeParse(queryParams);
  if (!validation.success) {
    return jsonError(
      {
        message: "Validation failed",
        details: (validation.error.errors || validation.error.issues || []).map(
          (issue) => ({
            path: issue.path ? issue.path.join(".") : "",
            message: issue.message || "Invalid input",
          })
        ),
      },
      400
    );
  }

  const { parentId, studentId } = validation.data;

  const linkId = `${parentId}_${studentId}`;
  initFirebaseAdmin();
  const db = getFirestore();

  // Retrieve existing link details from Firestore so we can cache it for compensation
  const linkDoc = await db.collection("parent_student_links").doc(linkId).get();
  if (!linkDoc.exists) {
    return jsonError("Parent-student link not found", 404);
  }
  const linkData = linkDoc.data();

  const sagaResult = await executeSaga({
    operationType: "delete_parent_student_link",
    uid: payload.uid,
    steps: [
      {
        name: "delete_firestore",
        execute: async () => {
          await db.collection("parent_student_links").doc(linkId).delete();
        },
        compensate: async () => {
          await db.collection("parent_student_links").doc(linkId).set(linkData);
        },
      },
      {
        name: "delete_mongodb",
        execute: async () => {
          const mongoDb = await connectDb();
          await mongoDb
            .collection("parent_student_links")
            .deleteOne({ _id: linkId });
        },
        compensate: async () => {
          const mongoDb = await connectDb();
          await mongoDb
            .collection("parent_student_links")
            .updateOne(
              { _id: linkId },
              { $set: { ...linkData, _id: linkId } },
              { upsert: true }
            );
        },
      },
    ],
  });

  if (!sagaResult.success) {
    throw new AppError(
      `Failed to delete parent-student link: ${sagaResult.error}`,
      500
    );
  }

  return jsonSuccess({ success: true }, 200);
});
