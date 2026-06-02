import { NextResponse } from "next/server";
import { getPaginatedCourses } from "@/lib/courses";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

/**
 * GET /api/courses
 * Retrieves a paginated, filtered list of courses.
 */
export const GET = withErrorHandler(async (request) => {
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

  const result = getPaginatedCourses({ q, category, page, limit });

  return NextResponse.json({
    success: true,
    ...result
  });
});
