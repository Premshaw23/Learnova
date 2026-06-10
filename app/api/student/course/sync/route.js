import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const syncPayloadSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  currentModuleId: z.string().min(1, "currentModuleId is required"),
  progress: z.number().min(0).max(100),
  timestamp: z.string().datetime().or(z.string())
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const userId = decodedToken.uid;

  const rateLimitResult = await checkRateLimit(`course_sync_${userId}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 50); // max 50KB
  const records = Array.isArray(body) ? body : [body];

  if (records.length === 0) {
    return NextResponse.json({ success: true, count: 0 });
  }

  // Validate all records
  const validatedRecords = [];
  for (const rec of records) {
    const parsed = syncPayloadSchema.safeParse(rec);
    if (!parsed.success) {
      throw new AppError("Invalid progress payload structure", 400);
    }
    validatedRecords.push(parsed.data);
  }

  const db = await connectDb();

  // Sort by timestamp asc so latest update is applied last
  validatedRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const record of validatedRecords) {
    const { courseId, currentModuleId, progress, timestamp } = record;

    await db.collection("course_progress").updateOne(
      { userId, courseId },
      {
        $set: {
          currentModuleId,
          progress,
          timestamp: new Date(timestamp),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  return NextResponse.json({
    success: true,
    count: validatedRecords.length
  });
});
