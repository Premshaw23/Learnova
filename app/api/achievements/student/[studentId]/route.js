import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess } from "@/lib/api-response";
import {
  buildAchievementFilter,
  listAchievements,
  countAchievements,
} from "@/lib/models/achievementModel";
import {
  assertStudentOwnership,
  assertInstituteScope,
  assertParentAccess,
} from "@/lib/services/achievementAccess";

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

export const GET = withErrorHandler(async (request, context) => {
  const { payload: decodedToken, profile } = await requireRole(request, [
    "student",
    "teacher",
    "admin",
    "parent",
  ]);

  const params = await context.params;
  const studentId = params?.studentId;
  const role = decodedToken.role;

  if (role === "parent") {
    await assertParentAccess(decodedToken.uid, studentId);
  } else {
    await assertStudentOwnership(decodedToken.uid, studentId, role);
    if (role === "teacher") {
      await assertInstituteScope(profile, studentId, role);
    }
  }

  const { searchParams } = new URL(request.url);
  const filter = buildAchievementFilter({
    studentId,
    ...parseFilters(searchParams),
  });

  const [achievements, total] = await Promise.all([
    listAchievements(filter),
    countAchievements(filter),
  ]);

  return jsonSuccess({ achievements, total });
});
