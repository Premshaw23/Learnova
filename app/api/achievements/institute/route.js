import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess } from "@/lib/api-response";
import { ForbiddenError } from "@/lib/errors";
import {
  buildAchievementFilter,
  listAchievements,
  countAchievements,
} from "@/lib/models/achievementModel";

export const dynamic = "force-dynamic";

function parseFilters(searchParams) {
  return {
    category: searchParams.get("category") || undefined,
    verificationStatus: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  };
}

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken, profile } = await requireRole(request, [
    "institute",
    "admin",
  ]);

  const { searchParams } = new URL(request.url);
  const instituteId =
    decodedToken.role === "admin"
      ? searchParams.get("instituteId") || undefined
      : profile?.instituteId || profile?.uid;

  if (!instituteId && decodedToken.role !== "admin") {
    throw new ForbiddenError(
      "Forbidden: User profile missing institute affiliation."
    );
  }

  const filter = buildAchievementFilter({
    instituteId,
    ...parseFilters(searchParams),
  });

  const [achievements, total] = await Promise.all([
    listAchievements(filter, { limit: 200 }),
    countAchievements(filter),
  ]);

  return jsonSuccess({ achievements, total, instituteId });
});
