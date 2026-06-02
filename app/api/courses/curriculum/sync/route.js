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

    let isDbPersisted = false;

    try {
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
          title: mod.title,
          order: modIdx,
          lessons: (mod.lessons || []).map((les, lesIdx) => ({
            id: les.id,
            title: les.title,
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
    } catch (dbError) {
      console.warn("MongoDB sync failed, relying on frontend optimistic caching:", dbError.message);
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
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
