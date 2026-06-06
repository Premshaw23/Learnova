import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess } from "@/lib/api-response";
import { ForbiddenError } from "@/lib/errors";
import {
  buildAchievementFilter,
  getAchievementAnalytics,
} from "@/lib/models/achievementModel";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken, profile } = await requireRole(request, [
    "teacher",
    "institute",
    "admin",
  ]);

  const { searchParams } = new URL(request.url);
  let instituteId = searchParams.get("instituteId") || undefined;

  if (decodedToken.role === "teacher") {
    instituteId = profile?.instituteId;
    if (!instituteId) {
      throw new ForbiddenError(
        "Forbidden: User profile missing institute affiliation."
      );
    }
  } else if (decodedToken.role === "institute") {
    instituteId = profile?.instituteId || profile?.uid;
  }

  const filter = buildAchievementFilter({
    instituteId: decodedToken.role === "admin" ? instituteId : instituteId,
    category: searchParams.get("category") || undefined,
    verificationStatus: searchParams.get("status") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  const analytics = await getAchievementAnalytics(filter);
  return jsonSuccess({ analytics });
});
