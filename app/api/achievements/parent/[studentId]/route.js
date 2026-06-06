import { withErrorHandler } from "@/lib/error-handler";
import { requireParent } from "@/lib/rbac";
import { jsonSuccess } from "@/lib/api-response";
import {
  buildAchievementFilter,
  listAchievements,
  countAchievements,
  getAchievementAnalytics,
} from "@/lib/models/achievementModel";
import { assertParentAccess } from "@/lib/services/achievementAccess";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request, context) => {
  const { payload: decodedToken } = await requireParent(request);
  const params = await context.params;
  const studentId = params?.studentId;

  await assertParentAccess(decodedToken.uid, studentId);

  const { searchParams } = new URL(request.url);
  const filter = buildAchievementFilter({
    studentId,
    category: searchParams.get("category") || undefined,
    verificationStatus: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });

  const [achievements, total, stats] = await Promise.all([
    listAchievements(filter),
    countAchievements(filter),
    getAchievementAnalytics({ studentId }),
  ]);

  const recent = achievements.slice(0, 5);

  return jsonSuccess({
    achievements,
    total,
    recentAccomplishments: recent,
    stats: {
      total: stats.total,
      verified: stats.verificationStats.Verified,
      pending: stats.verificationStats.Pending,
      categoryDistribution: stats.categoryDistribution,
    },
  });
});
