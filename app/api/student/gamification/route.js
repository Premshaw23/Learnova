import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { NotFoundError, AppError } from "@/lib/errors";
import { calculateLevel, calculateNextLevelXp } from "@/utils/gamification";
import { checkRateLimit } from "@/lib/rateLimit";
import { success } from "@/lib/api-response";

/**
 * GET /api/student/gamification
 *
 * Returns the authenticated student's gamification stats.
 * Passively initialises missing fields on first access so the
 * frontend never receives nulls.
 */
export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `gamification_get_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const db = await connectDb();
  const userId = decodedToken.uid;

  const student = await db.collection("users").findOne({ firebaseUid: userId });

  if (!student) {
    throw new NotFoundError("Student not found");
  }

  const totalXp = student.totalXp || 0;
  const currentLevel = student.currentLevel || calculateLevel(totalXp);
  const xpToNextLevel =
    student.xpToNextLevel || calculateNextLevelXp(currentLevel);

  const gamificationData = {
    currentStreak: student.currentStreak || 0,
    totalXp,
    currentLevel,
    xpToNextLevel,
    unlockedBadges: student.unlockedBadges || [],
    lastAttendanceDate: student.lastAttendanceDate || null,
  };

  if (student.totalXp === undefined) {
    await db
      .collection("users")
      .updateOne({ firebaseUid: userId }, { $set: gamificationData });
  }

  return success(gamificationData);
});
