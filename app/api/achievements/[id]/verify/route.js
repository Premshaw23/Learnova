import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { achievementVerifySchema } from "@/lib/validations/achievements";
import { getAchievementById, updateAchievement } from "@/lib/models/achievementModel";
import { assertInstituteScope } from "@/lib/services/achievementAccess";
import {
  notifyAchievementVerified,
  notifyAchievementRejected,
} from "@/lib/services/achievementNotifications";

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandler(async (request, context) => {
  const { payload: decodedToken, profile } = await requireRole(request, [
    "teacher",
    "admin",
  ]);
  const params = await context.params;
  const achievementId = params?.id;

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `achievements_verify_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const existing = await getAchievementById(achievementId);
  if (!existing) {
    return jsonError("Achievement not found", 404);
  }

  await assertInstituteScope(profile, existing.studentId, decodedToken.role);

  const body = await parseJSON(request, 1024 * 5);
  const validation = achievementVerifySchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { verificationStatus, remarks } = validation.data;
  const verifierName =
    profile?.fullName || profile?.displayName || decodedToken.email || "Staff";

  const achievement = await updateAchievement(achievementId, {
    verificationStatus,
    verifiedBy: { uid: decodedToken.uid, name: verifierName },
    remarks: remarks || null,
  });

  if (verificationStatus === "Verified") {
    await notifyAchievementVerified(existing.studentId, existing.title);
  } else {
    await notifyAchievementRejected(existing.studentId, existing.title, remarks);
  }

  return jsonSuccess({ achievement, message: `Achievement ${verificationStatus.toLowerCase()}` });
});
