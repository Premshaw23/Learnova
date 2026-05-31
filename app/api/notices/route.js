import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import { connectDb } from "@/lib/mongodb";

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

  const result = await adminDb
    .collection("notices")
    .add(newNotice);

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

  return NextResponse.json({
    success: true,
    notice: { id: result.id, ...newNotice }
  });
}

export const POST = withErrorHandler(publishNotice);
