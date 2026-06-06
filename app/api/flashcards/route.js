import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import * as FlashcardModel from "@/lib/models/flashcardModel";
import { checkRateLimit } from "@/lib/rateLimit";
import { createFlashcardSchema, validateOrThrow } from "@/lib/validations";

export const GET = withErrorHandler(async (request) => {
  const { payload } = await requireRole(request, [
    "student",
    "teacher",
    "admin",
  ]);
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;

  const items = await FlashcardModel.getUserFlashcards(payload.uid, {
    courseId,
    cursor,
  });
  const nextCursor =
    items.length > 0
      ? JSON.stringify({
          dueDate: items[items.length - 1].dueDate,
          updatedAt: items[items.length - 1].updatedAt,
          _id: items[items.length - 1]._id.toString(),
        })
      : null;
  return NextResponse.json({ items, nextCursor });
});

export const POST = withErrorHandler(async (request) => {
  const { payload } = await requireRole(request, [
    "student",
    "teacher",
    "admin",
  ]);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const limited = await checkRateLimit(`flashcards_post_${ip}_${payload.uid}`);
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  const data = await validateOrThrow(request, createFlashcardSchema, 1024 * 10);

  const card = {
    firebaseUid: payload.uid,
    front: data.front,
    back: data.back,
    origin: data.origin || null,
    courseId: data.courseId || null,
    tags: data.tags || [],
  };

  const created = await FlashcardModel.createFlashcard(card);

  return NextResponse.json(
    { success: true, flashcard: created },
    { status: 201 }
  );
});
