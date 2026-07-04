import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { ValidationError, AppError, ForbiddenError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { achievementUpdateSchema } from "@/lib/validations/achievements";
import {
  getAchievementById,
  updateAchievement,
  deleteAchievement,
} from "@/lib/models/achievementModel";
import { assertInstituteScope } from "@/lib/services/achievementAccess";

export const dynamic = "force-dynamic";

async function getRouteId(context) {
  const params = await context.params;
  return params?.id;
}

export const PUT = withErrorHandler(async (request, context) => {
  const { payload: decodedToken, profile } = await requireRole(request, [
    "teacher",
    "admin",
  ]);
  const achievementId = await getRouteId(context);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `achievements_update_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const existing = await getAchievementById(achievementId);
  if (!existing) {
    return jsonError("Achievement not found", 404);
  }

  await assertInstituteScope(profile, existing.studentId, decodedToken.role);

  const body = await parseJSON(request, 1024 * 20);
  const validation = achievementUpdateSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const achievement = await updateAchievement(achievementId, validation.data);
  return jsonSuccess({ achievement, message: "Achievement updated successfully" });
});

export const DELETE = withErrorHandler(async (request, context) => {
  const { payload: decodedToken, profile } = await requireRole(request, [
    "teacher",
    "admin",
  ]);
  const achievementId = await getRouteId(context);

  const existing = await getAchievementById(achievementId);
  if (!existing) {
    return jsonError("Achievement not found", 404);
  }

  if (decodedToken.role !== "admin") {
    await assertInstituteScope(profile, existing.studentId, decodedToken.role);
    if (existing.issuedBy?.uid !== decodedToken.uid) {
      throw new ForbiddenError("Forbidden: You can only delete achievements you created.");
    }
  }

  const deleted = await deleteAchievement(achievementId);
  if (!deleted) {
    return jsonError("Achievement not found", 404);
  }

  return jsonSuccess({ message: "Achievement deleted successfully" });
});
