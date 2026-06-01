import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import { connectDb } from "@/lib/mongodb";
import { publishNoticeToRedis } from "@/app/api/notices/stream/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["academic", "administrative", "financial", "general", "technical", "all"]),
  priority: z.enum(["low", "medium", "high"]),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).min(1, "Target audience is required"),
});

async function publishNotice(request) {
  const allowedRoles = ["teacher", "admin", "staff"];
  const { payload: decodedToken, profile } = await requireRole(request, allowedRoles);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`publish_notice_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 50);
  const validData = noticeSchema.parse(body);

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
