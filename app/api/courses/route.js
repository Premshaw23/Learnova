import { NextResponse } from "next/server";
import { getPaginatedCourses } from "@/lib/courses";

/**
 * GET /api/courses
 * Retrieves a paginated, filtered list of courses.
 */
const MAX_LIMIT    = 100;
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 12;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q        = searchParams.get("q")        || "";
    const category = searchParams.get("category") || "all";

    const rawPage  = parseInt(searchParams.get("page")  || String(DEFAULT_PAGE),  10);
    const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);

    // Clamp: reject NaN, enforce min/max bounds
    const page  = Number.isFinite(rawPage)  && rawPage  >= 1 ? rawPage  : DEFAULT_PAGE;
    const limit = Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const result = getPaginatedCourses({ q, category, page, limit });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("API Course Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
