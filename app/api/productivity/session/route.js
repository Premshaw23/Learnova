import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const DEFAULT_DAYS_BACK = 7;
const MAX_DAYS_BACK = 90;
const MAX_SESSION_PAYLOAD_BYTES = 1024 * 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const sessionSchema = z.object({
  duration: z
    .number({ message: "duration must be a number" })
    .int("duration must be an integer")
    .min(1, "duration must be at least 1 minute")
    .max(480, "duration cannot exceed 8 hours"),
  type: z.enum(["focus", "break"], {
    message: "type must be either 'focus' or 'break'",
  }),
});

function parseDateParam(value, fieldName) {
  const parsedDate = new Date(value);

  if (!Number.isFinite(parsedDate.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date string`);
  }

  return parsedDate;
}

export function parseSessionDateRange(searchParams, now = new Date()) {
  const rawEndDate = searchParams.get("endDate");
  const rawStartDate = searchParams.get("startDate");

  const endDate = rawEndDate ? parseDateParam(rawEndDate, "endDate") : now;
  const startDate = rawStartDate
    ? parseDateParam(rawStartDate, "startDate")
    : new Date(endDate.getTime() - DEFAULT_DAYS_BACK * DAY_MS);

  if (startDate.getTime() > endDate.getTime()) {
    throw new ValidationError("startDate must be before or equal to endDate");
  }

  const daySpan = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS)
  );

  // Cap the window to prevent unbounded scans
  if (daySpan > MAX_DAYS_BACK) {
    throw new ValidationError(`Date range cannot exceed ${MAX_DAYS_BACK} days`);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    daySpan,
  };
}

/**
 * POST /api/productivity/session
 *
 * Records a completed Pomodoro session (focus or break) to MongoDB.
 * Awards XP for completed focus sessions via the gamification system
 * if available — failures are silently caught to avoid blocking session recording.
 */
export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `productivity_session_post_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await parseJSON(request, MAX_SESSION_PAYLOAD_BYTES);

  const validation = sessionSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { duration, type } = validation.data;
  const now = new Date().toISOString();

  const db = await connectDb();
  const userId = decodedToken.uid;

  const sessionDoc = {
    firebaseUid: userId,
    duration,
    completedAt: now,
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
    } catch (error) {
      console.error("Failed to award XP for focus session:", error);
    }
  }

  return NextResponse.json({
    success: true,
    session: { duration, completedAt: now, type },
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
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `productivity_session_get_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const { searchParams } = new URL(request.url);
  const { startDate, endDate, daySpan } = parseSessionDateRange(searchParams);

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
  const totalFocusMinutes = focusSessions.reduce(
    (sum, s) => sum + s.duration,
    0
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
