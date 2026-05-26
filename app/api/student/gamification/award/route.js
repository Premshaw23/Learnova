import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { ValidationError } from "@/lib/errors";
import { awardXp, XP_VALUES } from "@/lib/gamification-service";
import { z } from "zod";

const VALID_ACTION_TYPES = Object.keys(XP_VALUES);

const awardSchema = z.object({
  actionType: z.enum(VALID_ACTION_TYPES, {
    message: `actionType must be one of: ${VALID_ACTION_TYPES.join(", ")}`,
  }),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/student/gamification/award
 *
 * Awards XP to the authenticated student for a given action.
 * Handles streak tracking for attendance actions, checks badge eligibility,
 * and persists all updates to the student's MongoDB document.
 *
 * Request body: { actionType: string, metadata?: object }
 */
export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["student"]);

  const body = await request.json();

  const validation = awardSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { actionType, metadata } = validation.data;

  const result = await awardXp(decodedToken.uid, actionType, metadata || {});

  const response = {
    success: true,
    xpAwarded: result.xpAwarded,
    totalXp: result.totalXp,
    currentLevel: result.currentLevel,
    xpToNextLevel: result.xpToNextLevel,
    levelUp: result.levelUp,
    newBadges: result.newBadges,
    currentStreak: result.currentStreak,
  };

  if (result.earlyBird) {
    response.earlyBird = true;
  }

  if (result.streakMilestones.length > 0) {
    response.streakMilestones = result.streakMilestones;
  }

  return NextResponse.json(response);
});
