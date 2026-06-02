import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAdmin } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withErrorHandler(async (request) => {
  await requireAdmin(request);
  initFirebaseAdmin();
  const db = getFirestore();

  // Fetch all links from Firestore
  const linksSnap = await db.collection("parent_student_links").get();
  
  const userIds = new Set();
  linksSnap.docs.forEach(doc => {
    userIds.add(doc.data().parentId);
    userIds.add(doc.data().studentId);
  });

  const userDocs = new Map();
  if (userIds.size > 0) {
    const uidArray = Array.from(userIds);
    const refs = uidArray.map(uid => db.collection("users").doc(uid));
    
    // Chunk refs into groups of 100 (getAll limit)
    for (let i = 0; i < refs.length; i += 100) {
      const chunkRefs = refs.slice(i, i + 100);
      const docs = await db.getAll(...chunkRefs);
      docs.forEach(doc => {
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
      parentName: pData ? (pData.fullName || pData.name || "Unknown") : "Unknown Parent",
      parentEmail: pData ? pData.email : "N/A",
      studentName: sData ? (sData.fullName || sData.name || "Unknown") : "Unknown Student",
      studentEmail: sData ? sData.email : "N/A",
    });
  }

  return jsonSuccess({ links }, 200);
});

export const POST = withErrorHandler(async (request) => {
  const { payload } = await requireAdmin(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`link_creation_${ip}_${payload.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 5);
  const { parentEmail, studentEmail } = body;

  if (!parentEmail || !studentEmail) {
    return jsonError("Parent and student emails are required", 400);
  }

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
    return jsonError(`User "${parentEmail}" is registered as "${parentProfile.role}", not "parent"`, 400);
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
    return jsonError(`User "${studentEmail}" is registered as "${studentProfile.role}", not "student"`, 400);
  }

  const parentId = parentProfile.uid;
  const studentId = studentProfile.uid;
  const linkId = `${parentId}_${studentId}`;

  // Check if link already exists
  const existingLink = await db.collection("parent_student_links").doc(linkId).get();
  if (existingLink.exists) {
    return jsonError("This relationship is already linked", 400);
  }

  const linkData = {
    parentId,
    studentId,
    createdAt: new Date().toISOString(),
  };

  // Add to Firestore
  await db.collection("parent_student_links").doc(linkId).set(linkData);

  // Add to MongoDB
  try {
    const mongoDb = await connectDb();
    await mongoDb.collection("parent_student_links").updateOne(
      { _id: linkId },
      { $set: { ...linkData, _id: linkId } },
      { upsert: true }
    );
  } catch (mongoError) {
    console.error("Failed to sync parent-student link to MongoDB:", mongoError);
  }

  return jsonSuccess({ success: true, link: { id: linkId, ...linkData } }, 201);
});

export const DELETE = withErrorHandler(async (request) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const parentId = url.searchParams.get("parentId");
  const studentId = url.searchParams.get("studentId");

  if (!parentId || !studentId) {
    return jsonError("Missing parentId or studentId parameters", 400);
  }

  const linkId = `${parentId}_${studentId}`;
  initFirebaseAdmin();
  const db = getFirestore();

  // Delete from Firestore
  await db.collection("parent_student_links").doc(linkId).delete();

  // Delete from MongoDB
  try {
    const mongoDb = await connectDb();
    await mongoDb.collection("parent_student_links").deleteOne({ _id: linkId });
  } catch (mongoError) {
    console.error("Failed to delete link from MongoDB:", mongoError);
  }

  return jsonSuccess({ success: true }, 200);
});
