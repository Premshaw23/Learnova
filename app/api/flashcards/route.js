import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import * as FlashcardModel from "@/lib/models/flashcardModel";

const createSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  origin: z.string().optional(),
  courseId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (request) => {
  const { payload } = await requireRole(request, ["student", "teacher", "admin"]);
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;

  const items = await FlashcardModel.getUserFlashcards(payload.uid, { courseId, cursor });
  const nextCursor = items.length > 0 ? items[items.length - 1]._id.toString() : null;
  return NextResponse.json({ items, nextCursor });
});

export const POST = withErrorHandler(async (request) => {
  const { payload } = await requireRole(request, ["student", "teacher", "admin"]);
  const body = await request.json();

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0]?.message || "Invalid payload";
    throw new Error(first);
  }

  const card = {
    firebaseUid: payload.uid,
    front: parsed.data.front,
    back: parsed.data.back,
    origin: parsed.data.origin || null,
    courseId: parsed.data.courseId || null,
    tags: parsed.data.tags || [],
  };

  const created = await FlashcardModel.createFlashcard(card);

  return NextResponse.json({ success: true, flashcard: created }, { status: 201 });
});
