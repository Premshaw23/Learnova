import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { ForbiddenError } from "@/lib/errors";
import { curriculumSyncSchema, validateOrThrow } from "@/lib/validations";

const MAX_PAYLOAD_BYTES = 1024 * 500;

/**
 * POST /api/courses/curriculum/sync — persists a validated curriculum structure to MongoDB.
 */
export const POST = withErrorHandler(async (request) => {
  const { payload, profile } = await requireRole(request, ["teacher", "admin"]);

  const { courseId, modules } = await validateOrThrow(request, curriculumSyncSchema, MAX_PAYLOAD_BYTES);

  let isDbPersisted = false;

  if (process.env.MONGODB_URI) {
    const db = await connectDb();

    if (profile?.role !== "admin") {
      const existing = await db
        .collection("course_curriculums")
        .findOne({ courseId }, { projection: { ownerId: 1 } });
      if (existing && existing.ownerId !== payload.uid) {
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
          ownerId: payload.uid,
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
