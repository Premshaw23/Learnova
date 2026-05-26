import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { NotFoundError } from "@/lib/errors";
import { calculateLevel, calculateNextLevelXp } from "@/utils/gamification";

/**
 * GET /api/student/gamification
 *
 * Returns the authenticated student's gamification stats.
 * Passively initialises missing fields on first access so the
 * frontend never receives nulls.
 */
export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["student", "admin"]);
  const db = await connectDb();
  const userId = decodedToken.uid;

  const student = await db.collection("users").findOne({ firebaseUid: userId });

  if (!student) {
    throw new NotFoundError("Student not found");
  }

  const totalXp = student.totalXp || 0;
  const currentLevel = student.currentLevel || calculateLevel(totalXp);
  const xpToNextLevel = student.xpToNextLevel || calculateNextLevelXp(currentLevel);

  const gamificationData = {
    currentStreak: student.currentStreak || 0,
    totalXp,
    currentLevel,
    xpToNextLevel,
    unlockedBadges: student.unlockedBadges || [],
    lastAttendanceDate: student.lastAttendanceDate || null,
  };

  if (student.totalXp === undefined) {
    await db.collection("users").updateOne(
      { firebaseUid: userId },
      { $set: gamificationData }
    );
  }

  return NextResponse.json(gamificationData, { status: 200 });
});
