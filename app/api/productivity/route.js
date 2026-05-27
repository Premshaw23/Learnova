import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const MAX_ITEMS = 500;
const MAX_AGENDA_DAYS = 60;

const taskSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string().min(1),
  done: z.boolean(),
  priority: z.string().optional(),
  createdAt: z.string().optional(),
});

const agendaItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string().min(1),
  label: z.string().optional(),
  time: z.string().optional(),
  timeMinutes: z.number().optional(),
});

const postSchema = z.object({
  tasks: z.array(taskSchema).max(MAX_ITEMS, `Tasks cannot exceed ${MAX_ITEMS} items`),
  agendaItems: z.record(
    z.string(),
    z.array(agendaItemSchema).max(MAX_ITEMS, `Agenda items per day cannot exceed ${MAX_ITEMS}`)
  ).refine(
    (record) => Object.keys(record).length <= MAX_AGENDA_DAYS,
    { message: `Cannot sync more than ${MAX_AGENDA_DAYS} days of agenda items` }
  ),
});

/**
 * GET /api/productivity
 *
 * Returns the authenticated student's tasks and agenda items from MongoDB.
 * Returns empty defaults for first-time users.
 */
export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["student", "teacher", "admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`productivity_get_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const db = await connectDb();
  const userId = decodedToken.uid;

  const doc = await db.collection("productivity").findOne({ firebaseUid: userId });

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
  const { payload: decodedToken } = await requireRole(request, ["student", "teacher", "admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`productivity_post_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const body = await request.json();

  const validation = postSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { tasks, agendaItems } = validation.data;
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
