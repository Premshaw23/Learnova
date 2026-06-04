import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { connectDb } from "@/lib/mongodb";
import { publishNoticeToRedis } from "@/app/api/notices/stream/route";
import { createNoticeSchema } from "@/lib/validations/notices";
import { validateRequest } from "@/lib/validations/validateRequest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


async function publishNotice(request) {
  const allowedRoles = ["teacher", "admin", "staff"];
  const { payload: decodedToken, profile } = await requireRole(request, allowedRoles);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`publish_notice_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const validationResult = await validateRequest(request, createNoticeSchema, 1024 * 50);
  if (!validationResult.success) {
    return validationResult.response;
  }
  const validData = validationResult.data;

  const adminDb = getAdminDb();

  const instituteId = profile.instituteId || profile.uid;

  const newNotice = {
    ...validData,
    instituteId,
    author: decodedToken.name || decodedToken.email.split("@")[0],
    authorId: decodedToken.uid,
    authorRole: profile.role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await adminDb
    .collection("notices")
    .add(newNotice);

  const noticeWithId = { ...newNotice, _id: result.id, id: result.id };

  // Sync to MongoDB for historical queries and fallback polling
  try {
    const mongoDb = await connectDb();
    await mongoDb.collection("notices").insertOne({
      ...newNotice,
      _id: result.id,
    });
  } catch (mongoError) {
    console.error("Failed to sync notice to MongoDB:", mongoError);
  }

  // Publish to Redis for real-time SSE delivery across serverless instances
  try {
    await publishNoticeToRedis(noticeWithId);
  } catch (redisError) {
    console.error("Failed to publish notice to Redis:", redisError);
  }

  return NextResponse.json({
    success: true,
    notice: noticeWithId,
  });
}

export const POST = withErrorHandler(publishNotice);
