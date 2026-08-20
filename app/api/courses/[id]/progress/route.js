import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { ValidationError } from "@/lib/errors";
import { z } from "zod";
import { awardXp } from "@/lib/gamification-service";

const MAX_PROGRESS_PAYLOAD_BYTES = 1024 * 20;

const progressSchema = z.object({
  completedLessons: z.record(z.boolean()),
  completionPercentage: z
    .number({ message: "completionPercentage must be a number" })
    .min(0)
    .max(100),
});

/**
 * PATCH /api/courses/[id]/progress
 *
 * Persists per-user lesson completion state server-side (mirroring the
 * pattern in app/api/productivity/session/route.js). When completion
 * reaches 100% for the first time, records completionDate and awards
 * "course_completed" XP exactly once (deduped via a stored flag on the
 * progress document).
 */
export const PATCH = withErrorHandler(async (request, { params }) => {
  const decodedToken = await requireAuth(request);
  const { id: courseId } = await params;

  if (!courseId) {
    throw new ValidationError("Course ID is required");
  }

  const body = await parseJSON(request, MAX_PROGRESS_PAYLOAD_BYTES);
  const validation = progressSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { completedLessons, completionPercentage } = validation.data;
  const userId = decodedToken.uid;
  const now = new Date().toISOString();

  const db = await connectDb();
  const existing = await db.collection("course_progress").findOne({
    firebaseUid: userId,
    courseId,
  });

  const wasAlreadyCompleted = Boolean(existing?.completed);

  // Never trust the client's completionPercentage. Recompute it from the
  // authoritative stored curriculum (completedLessons is keyed by lesson title,
  // same as the course page). The one-time XP is only awarded on a
  // server-verified 100%, so a forged { completedLessons: {},
  // completionPercentage: 100 } can no longer self-award course completion.
  const curriculum = await db
    .collection("course_curriculums")
    .findOne({ courseId: { $eq: courseId } });
  let verifiedPercentage = null;
  if (curriculum?.modules?.length) {
    const totalLessons = curriculum.modules.reduce(
      (sum, mod) => sum + (mod.lessons?.length || 0),
      0
    );
    const completedCount = curriculum.modules.reduce(
      (sum, mod) =>
        sum +
        (mod.lessons || []).filter((les) => completedLessons[les.title]).length,
      0
    );
    verifiedPercentage =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  }

  // Verified value drives completion + XP; the client value is used only for
  // progress display when no stored curriculum exists for the course.
  const effectivePercentage = verifiedPercentage ?? completionPercentage;
  const isNowCompleted = effectivePercentage === 100;
  const completionVerified = verifiedPercentage === 100;

  const completionDate =
    existing?.completionDate ||
    (isNowCompleted
      ? new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "");

  await db.collection("course_progress").updateOne(
    { firebaseUid: userId, courseId },
    {
      $set: {
        firebaseUid: userId,
        courseId,
        completedLessons,
        completionPercentage: effectivePercentage,
        completed: isNowCompleted,
        completionDate: isNowCompleted ? completionDate : "",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  let xpAwarded = 0;
  if (completionVerified && !wasAlreadyCompleted) {
    try {
      const result = await awardXp(userId, "course_completed", { courseId });
      xpAwarded = result.xpAwarded || 0;
    } catch (error) {
      console.error("Failed to award XP for course completion:", error);
    }
  }

  return NextResponse.json({
    success: true,
    completedLessons,
    completionPercentage: effectivePercentage,
    completed: isNowCompleted,
    completionDate: isNowCompleted ? completionDate : "",
    xpAwarded,
  });
});

/**
 * GET /api/courses/[id]/progress
 *
 * Returns the authenticated user's persisted completion state for a
 * course, so progress survives cleared localStorage or a new device.
 */
export const GET = withErrorHandler(async (request, { params }) => {
  const decodedToken = await requireAuth(request);
  const { id: courseId } = await params;

  if (!courseId) {
    throw new ValidationError("Course ID is required");
  }

  const db = await connectDb();
  const progress = await db.collection("course_progress").findOne({
    firebaseUid: decodedToken.uid,
    courseId,
  });

  return NextResponse.json({
    completedLessons: progress?.completedLessons || {},
    completionPercentage: progress?.completionPercentage || 0,
    completed: Boolean(progress?.completed),
    completionDate: progress?.completionDate || "",
  });
});