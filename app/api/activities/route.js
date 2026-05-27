import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest, parseJSON } from "@/lib/error-handler";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { z } from "zod";

// Allowed values for the type field. Any string outside this set would produce
// unexpected behaviour in downstream rendering logic that switches on type.
const ALLOWED_TYPES = ["course", "quiz", "assignment"];

const activitySchema = z.object({
  title: z
    .string({ required_error: "title is required" })
    .min(1, "title cannot be empty")
    .max(200, "title cannot exceed 200 characters")
    .trim(),
  type: z
    .enum(ALLOWED_TYPES, {
      errorMap: () => ({ message: `type must be one of: ${ALLOWED_TYPES.join(", ")}` }),
    })
    .default("course"),
  progress: z
    .number({ invalid_type_error: "progress must be a number" })
    .int("progress must be an integer")
    .min(0, "progress cannot be negative")
    .max(100, "progress cannot exceed 100")
    .default(0),
});

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

  // Rate-limit writes per user to prevent activity flooding
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`activities_post_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024);

  // Validate and sanitize fields before any Firestore write
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues?.[0]?.message || "Invalid request payload";
    throw new AppError(firstError, 400);
  }

  const { title, type, progress } = parsed.data;

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
