import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { getUserProfile } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/verify
 * Logs a student's exam verification attempt.
 */
export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  
  const rateLimitResult = await checkRateLimit(`verify_post_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024);
  const { examId, userId, studentName, status, confidence } = body;

  if (!examId || !userId || !status) {
    return jsonError("Missing required fields: examId, userId, status", 400);
  }

  // Prevent users from logging verification for others (unless they are instructor/admin)
  const userProfile = await getUserProfile(decodedToken.uid);
  const isInstructorOrAdmin = userProfile?.role === "teacher" || userProfile?.role === "admin";
  if (decodedToken.uid !== userId && !isInstructorOrAdmin) {
    return jsonError("Forbidden: Cannot log verification for another user", 403);
  }

  const db = await connectDb();
  const verificationRecord = {
    examId,
    userId,
    studentName: studentName || userProfile?.fullName || decodedToken.name || "Unknown Student",
    status, // "verified", "failed", "pending_override", "manually_approved"
    confidence: typeof confidence === "number" ? confidence : 0,
    timestamp: new Date(),
    updatedBy: decodedToken.uid,
  };

  // Upsert the verification result for this user + exam
  await db.collection("exam_verifications").updateOne(
    { examId, userId },
    { $set: verificationRecord },
    { upsert: true }
  );

  return jsonSuccess({ record: verificationRecord }, 201);
});

/**
 * GET /api/verify
 * Fetches all exam verification logs for an instructor.
 */
export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const userProfile = await getUserProfile(decodedToken.uid);
  
  const isInstructorOrAdmin = userProfile?.role === "teacher" || userProfile?.role === "admin";

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  const userId = searchParams.get("userId");

  if (userId) {
    if (decodedToken.uid !== userId && !isInstructorOrAdmin) {
      return jsonError("Forbidden", 403);
    }
    const db = await connectDb();
    const student = await db.collection("users").findOne({ firebaseUid: userId });
    return jsonSuccess({
      userId,
      fullName: student?.fullName || student?.name || "Unknown Student",
      faceDescriptor: student?.faceDescriptor || null,
      imageUrl: student?.imageUrl || null,
    }, 200);
  }

  if (!isInstructorOrAdmin) {
    return jsonError("Forbidden: Only instructors can view verification logs", 403);
  }

  if (!examId) {
    return jsonError("Missing examId query parameter", 400);
  }

  const db = await connectDb();
  const logs = await db
    .collection("exam_verifications")
    .find({ examId })
    .sort({ timestamp: -1 })
    .toArray();

  return jsonSuccess({ logs }, 200);
});
