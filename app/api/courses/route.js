import { NextResponse } from "next/server";
import { getPaginatedCourses } from "@/lib/courses";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

const ALLOWED_CATEGORIES = new Set([
  "all", "programming", "data-science", "design", "business", "marketing",
]);

/**
 * GET /api/courses
 * Retrieves a paginated, filtered list of courses.
 */
const MAX_LIMIT    = 100;
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 12;

export const GET = withErrorHandler(async (request) => {
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  let q        = searchParams.get("q")        || "";
  let category = searchParams.get("category") || "all";

  if (!ALLOWED_CATEGORIES.has(category)) {
    category = "all";
  }

  // Sanitize search query: strip control characters, limit length
  q = q.replace(/[\x00-\x1f\x7f-\x9f]/g, "").slice(0, 200);

  const rawPage  = parseInt(searchParams.get("page")  || String(DEFAULT_PAGE),  10);
  const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);

  // Clamp: reject NaN, enforce min/max bounds
  const page  = Number.isFinite(rawPage)  && rawPage  >= 1 ? rawPage  : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const result = getPaginatedCourses({ q, category, page, limit });

  return NextResponse.json({ success: true, ...result });
});
