import { z } from "zod";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { getUserProfile } from "@/lib/firebase-admin";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { ValidationError, ForbiddenError } from "@/lib/errors";

const MAX_PAYLOAD_BYTES = 1024 * 500;

const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Lesson title is required").max(200),
  duration: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  completed: z.boolean().optional(),
});

const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Module title is required").max(200),
  lessons: z.array(lessonSchema).max(100).optional().default([]),
});

const curriculumSyncSchema = z
  .object({
    courseId: z.string().min(1, "Course ID is required").max(100),
    modules: z.array(moduleSchema).max(50, "Too many modules (max 50)"),
  })
  .strict();

/**
 * POST /api/courses/curriculum/sync — persists a validated curriculum structure to MongoDB.
 */
export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const profile = await getUserProfile(decodedToken.uid);

  const body = await parseJSON(request, MAX_PAYLOAD_BYTES);
  const parsed = curriculumSyncSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message || "Invalid curriculum payload"
    );
  }

  const { courseId, modules } = parsed.data;

  let isDbPersisted = false;

  if (process.env.MONGODB_URI) {
    const db = await connectDb();

    if (profile?.role !== "admin") {
      const existing = await db
        .collection("course_curriculums")
        .findOne({ courseId }, { projection: { ownerId: 1 } });
      if (existing && existing.ownerId !== decodedToken.uid) {
        throw new ForbiddenError(
          "Forbidden: You do not own this course curriculum"
        );
      }
    }

    const structuredModules = modules.map((mod, modIdx) => ({
      id: mod.id,
      title: mod.title.trim(),
      order: modIdx,
      lessons: mod.lessons.map((les, lesIdx) => ({
        id: les.id,
        title: les.title.trim(),
        duration: les.duration || "15 mins",
        type: les.type || "video",
        completed: les.completed || false,
        order: lesIdx,
      })),
    }));

    await db.collection("course_curriculums").updateOne(
      { courseId },
      {
        $set: {
          modules: structuredModules,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          ownerId: decodedToken.uid,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    isDbPersisted = true;
  }

  return jsonSuccess({
    persisted: isDbPersisted,
    message: isDbPersisted
      ? "Curriculum synced to MongoDB successfully"
      : "Curriculum cached successfully (Demo fallback mode active)",
  });
});
