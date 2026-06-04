import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";

export async function POST(request) {
  try {
    // Authenticate and authorize — only teachers and admins can modify curricula
    const { payload, profile } = await requireRole(request, ["teacher", "admin"]);

    const body = await request.json();
    const { courseId, modules } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { success: false, error: "Modules must be a valid array" },
        { status: 400 }
      );
    }

    // Validate each module entry. Accepting arbitrary objects without schema
    // validation allows malformed data (null IDs, non-string titles, lesson
    // arrays that are actually objects) to be persisted, causing downstream
    // errors when the curriculum is rendered or processed.
    const invalidModules = modules.filter(
      (mod, idx) =>
        mod === null ||
        typeof mod !== "object" ||
        typeof mod.title !== "string" ||
        mod.title.trim() === "" ||
        (mod.lessons !== undefined && !Array.isArray(mod.lessons))
    );

    if (invalidModules.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Each module must be an object with a non-empty title string and an optional lessons array",
        },
        { status: 400 }
      );
    }

    // Validate each lesson within every module.
    for (let modIdx = 0; modIdx < modules.length; modIdx++) {
      const lessons = modules[modIdx].lessons || [];
      const invalidLessons = lessons.filter(
        (les) =>
          les === null ||
          typeof les !== "object" ||
          typeof les.title !== "string" ||
          les.title.trim() === ""
      );
      if (invalidLessons.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Module at index ${modIdx} contains lessons with missing or invalid title fields`,
          },
          { status: 400 }
        );
      }
    }

    let isDbPersisted = false;

    if (process.env.MONGODB_URI) {
      const db = await connectDb();

      // Ownership check: only the original creator or an admin can modify a curriculum
      if (profile?.role !== "admin") {
        const existing = await db.collection("course_curriculums").findOne(
          { courseId },
          { projection: { ownerId: 1 } }
        );
        if (existing && existing.ownerId !== payload.uid) {
          return NextResponse.json(
            { success: false, error: "Forbidden: You do not own this course curriculum" },
            { status: 403 }
          );
        }
      }

      // Structure the modules list to enforce position sequences
      const structuredModules = modules.map((mod, modIdx) => ({
        id: mod.id,
        title: mod.title.trim(),
        order: modIdx,
        lessons: (mod.lessons || []).map((les, lesIdx) => ({
          id: les.id,
          title: les.title.trim(),
          duration: les.duration || "15 mins",
          type: les.type || "video",
          completed: les.completed || false,
          order: lesIdx
        }))
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

    return NextResponse.json({
      success: true,
      persisted: isDbPersisted,
      message: isDbPersisted
        ? "Curriculum synced atomically to MongoDB successfully"
        : "Curriculum cached successfully (Demo fallback mode active)"
    });
  } catch (error) {
    console.error("POST Curriculum Sync API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
