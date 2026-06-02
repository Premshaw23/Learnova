import { NextResponse } from "next/server";
import { getPaginatedCourses } from "@/lib/courses";

/**
 * GET /api/courses
 * Retrieves a paginated, filtered list of courses.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = getPaginatedCourses({ q, category, page, limit });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("API Course Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
