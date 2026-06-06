import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { productivityPostSchema, validateOrThrow } from "@/lib/validations";

const MAX_PRODUCTIVITY_PAYLOAD_BYTES = 1024 * 100;

/**
 * GET /api/productivity
 *
 * Returns the authenticated student's tasks and agenda items from MongoDB.
 * Returns empty defaults for first-time users.
 */
export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, [
    "student",
    "teacher",
    "admin",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `productivity_get_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const db = await connectDb();
  const userId = decodedToken.uid;

  const doc = await db
    .collection("productivity")
    .findOne({ firebaseUid: userId });

  if (!doc) {
    return NextResponse.json({
      tasks: [],
      agendaItems: {},
      lastSyncedAt: null,
    });
  }

  return NextResponse.json({
    tasks: doc.tasks || [],
    agendaItems: doc.agendaItems || {},
    lastSyncedAt: doc.updatedAt || null,
  });
});

/**
 * POST /api/productivity
 *
 * Saves the authenticated user's tasks and agenda items to MongoDB.
 * Uses upsert to handle both first-time and returning users.
 * Validates input with Zod to prevent abuse.
 */
export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, [
    "student",
    "teacher",
    "admin",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `productivity_post_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const { tasks, agendaItems } = await validateOrThrow(request, productivityPostSchema, MAX_PRODUCTIVITY_PAYLOAD_BYTES);
  const now = new Date().toISOString();

  const db = await connectDb();
  const userId = decodedToken.uid;

  await db.collection("productivity").updateOne(
    { firebaseUid: userId },
    {
      $set: {
        tasks,
        agendaItems,
        updatedAt: now,
      },
      $setOnInsert: {
        firebaseUid: userId,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({
    success: true,
    lastSyncedAt: now,
  });
});
