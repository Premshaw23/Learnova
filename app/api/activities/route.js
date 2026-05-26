import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest, parseJSON } from "@/lib/error-handler";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);
  initFirebaseAdmin();
  const db = getFirestore();

  const snapshot = await db
    .collection("activities")
    .where("userId", "==", decodedToken.uid)
    .orderBy("timestamp", "desc")
    .get();

  const activities = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
  }));

  return jsonSuccess({ activities }, 200);
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);
  const body = await parseJSON(request, 1024);
  const { title, type, progress } = body;

  initFirebaseAdmin();
  const db = getFirestore();

  const docRef = await db.collection("activities").add({
    userId: decodedToken.uid,
    title,
    type: type || "course",
    progress: progress || 0,
    timestamp: FieldValue.serverTimestamp(),
  });

  return jsonSuccess({ id: docRef.id }, 201);
});

export const DELETE = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("id");

  if (!activityId) {
    return jsonError("Missing activity id", 400);
  }

  initFirebaseAdmin();
  const db = getFirestore();

  const activityRef = db.collection("activities").doc(activityId);
  const activityDoc = await activityRef.get();

  if (!activityDoc.exists) {
    return jsonError("Activity not found", 404);
  }

  if (activityDoc.data().userId !== decodedToken.uid) {
    return jsonError("Forbidden", 403);
  }

  await activityRef.delete();

  return jsonSuccess({ success: true }, 200);
});
