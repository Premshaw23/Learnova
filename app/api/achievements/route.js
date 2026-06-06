import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { jsonSuccess } from "@/lib/api-response";
import { ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { getUserProfile } from "@/lib/firebase-admin";
import { achievementCreateSchema } from "@/lib/validations/achievements";
import { createAchievement } from "@/lib/models/achievementModel";
import { assertInstituteScope } from "@/lib/services/achievementAccess";
import { notifyAchievementCreated } from "@/lib/services/achievementNotifications";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken, profile } = await requireRole(request, [
    "teacher",
    "admin",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `achievements_create_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 20);
  const validation = achievementCreateSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { studentId, title, description, category, certificateUrl, achievementDate } =
    validation.data;

  await assertInstituteScope(profile, studentId, decodedToken.role);

  const student = await getUserProfile(studentId);
  if (!student || student.role !== "student") {
    throw new ValidationError("Target user is not a valid student.");
  }

  const issuerName =
    profile?.fullName || profile?.displayName || decodedToken.email || "Staff";

  const achievement = await createAchievement({
    studentId,
    studentName: student.fullName || student.displayName || student.email || "Student",
    instituteId: student.instituteId || profile?.instituteId || null,
    title,
    description,
    category,
    certificateUrl: certificateUrl || null,
    achievementDate,
    issuedBy: { uid: decodedToken.uid, name: issuerName },
  });

  await notifyAchievementCreated(studentId, title, issuerName);

  return jsonSuccess({ achievement, message: "Achievement created successfully" }, 201);
});
