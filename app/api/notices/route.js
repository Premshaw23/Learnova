import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { connectDb } from "@/lib/mongodb";
import { publishNoticeToRedis } from "@/app/api/notices/stream/route";
import { createNoticeSchema, withValidation } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function publishNotice(request, validData) {
  const allowedRoles = ["teacher", "admin", "staff"];
  const { payload: decodedToken, profile } = await requireRole(
    request,
    allowedRoles
  );

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `publish_notice_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const adminDb = getAdminDb();
  const instituteId = profile.instituteId || null;

  const newNotice = {
    ...validData,
    author: decodedToken.name || decodedToken.email.split("@")[0],
    authorId: decodedToken.uid,
    authorRole: profile.role,
    instituteId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await adminDb.collection("notices").add(newNotice);

  // Sync to MongoDB for SSE Change Stream support
  try {
    const mongoDb = await connectDb();
    await mongoDb.collection("notices").insertOne({
      ...newNotice,
      _id: result.id,
    });
  } catch (mongoError) {
    console.error("Failed to sync notice to MongoDB:", mongoError);
  }

  // Publish to Redis for real-time SSE delivery
  try {
    await publishNoticeToRedis({
      ...newNotice,
      _id: result.id,
    });
  } catch (redisError) {
    console.error("Failed to publish notice to Redis:", redisError);
  }

  return NextResponse.json({
    success: true,
    notice: { id: result.id, ...newNotice },
  });
}

export const POST = withErrorHandler(
  withValidation(createNoticeSchema, publishNotice, { maxBytes: 1024 * 50 })
);
