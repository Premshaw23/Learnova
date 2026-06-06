import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rateLimit";
import { activitySchema, validateOrThrow } from "@/lib/validations";

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  initFirebaseAdmin();
  const db = getFirestore();

  const snapshot = await db
    .collection("activities")
    .where("userId", "==", decodedToken.uid)
    .orderBy("timestamp", "desc")
    .limit(100)
    .get();

  const activities = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp:
      doc.data().timestamp?.toDate?.()?.toISOString() ||
      new Date().toISOString(),
  }));

  return jsonSuccess({ activities }, 200);
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const limited = await checkRateLimit(decodedToken.uid);
  if (!limited.allowed) {
    return jsonError("Too many requests. Please slow down.", 429);
  }

  const { title, type, progress } = await validateOrThrow(request, activitySchema, 1024);

  initFirebaseAdmin();
  const db = getFirestore();

  const docRef = await db.collection("activities").add({
    userId: decodedToken.uid,
    title,
    type,
    progress,
    timestamp: FieldValue.serverTimestamp(),
  });

  return jsonSuccess({ id: docRef.id }, 201);
});

export const DELETE = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
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
