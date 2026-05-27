import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const DEFAULT_DAYS_BACK = 7;

const sessionSchema = z.object({
  duration: z
    .number({ message: "duration must be a number" })
    .int("duration must be an integer")
    .min(1, "duration must be at least 1 minute")
    .max(480, "duration cannot exceed 8 hours"),
  completedAt: z
    .string({ message: "completedAt is required" })
    .datetime({ message: "completedAt must be a valid ISO date string" }),
  type: z.enum(["focus", "break"], {
    message: "type must be either 'focus' or 'break'",
  }),
});

/**
 * POST /api/productivity/session
 *
 * Records a completed Pomodoro session (focus or break) to MongoDB.
 * Awards XP for completed focus sessions via the gamification system
 * if available — failures are silently caught to avoid blocking session recording.
 */
export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["student", "teacher", "admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`productivity_session_post_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await request.json();

  const validation = sessionSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { duration, completedAt, type } = validation.data;
  const now = new Date().toISOString();

  const db = await connectDb();
  const userId = decodedToken.uid;

  const sessionDoc = {
    firebaseUid: userId,
    duration,
    completedAt,
    type,
    createdAt: now,
  };

  await db.collection("pomodoro_sessions").insertOne(sessionDoc);

  let xpAwarded = 0;
  if (type === "focus") {
    try {
      const { awardXp } = await import("@/lib/gamification-service");
      const result = await awardXp(userId, "focus_session_completed", {});
      xpAwarded = result.xpAwarded || 0;
    } catch (_) {
      // Gamification service may not be available yet — silently continue
    }
  }

  return NextResponse.json({
    success: true,
    session: { duration, completedAt, type },
    xpAwarded,
  });
});

/**
 * GET /api/productivity/session
 *
 * Returns Pomodoro sessions for the authenticated user within a date range.
 * Defaults to the last 7 days. Includes summary stats:
 * totalSessions, totalFocusMinutes, averagePerDay.
 */
export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["student", "teacher", "admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`productivity_session_get_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const { searchParams } = new URL(request.url);
  const endDate = searchParams.get("endDate") || new Date().toISOString();
  const startDate =
    searchParams.get("startDate") ||
    new Date(Date.now() - DEFAULT_DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();

  const db = await connectDb();
  const userId = decodedToken.uid;

  const sessions = await db
    .collection("pomodoro_sessions")
    .find({
      firebaseUid: userId,
      completedAt: { $gte: startDate, $lte: endDate },
    })
    .sort({ completedAt: -1 })
    .toArray();

  const focusSessions = sessions.filter((s) => s.type === "focus");
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);

  const daySpan = Math.max(
    1,
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
  );

  return NextResponse.json({
    sessions: sessions.map(({ _id, ...rest }) => rest),
    stats: {
      totalSessions: sessions.length,
      totalFocusMinutes,
      averagePerDay: Math.round(totalFocusMinutes / daySpan),
    },
  });
});
