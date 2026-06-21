import { NextResponse } from "next/server";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { createNoteSchema } from "@/lib/validations/notes";
import { createNote, getUserNotes } from "@/lib/models/noteModel";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const payload = await requireAuth(request);
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") || undefined;
  const videoId = url.searchParams.get("videoId") || undefined;

  const items = await getUserNotes(payload.uid, { courseId, videoId });
  return NextResponse.json({ success: true, items });
});

export const POST = withErrorHandler(async (request) => {
  const payload = await requireAuth(request);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`notes_post_${ip}_${payload.uid}`);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await parseJSON(request, 1024 * 50); // limit payload size to 50KB

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0]?.message || "Invalid payload";
    // We throw or return 400. In project pattern, throwing custom validation error works, 
    // or returning a clean JSON error. Let's return JSON error for precise API contracts.
    return NextResponse.json({ success: false, error: first }, { status: 400 });
  }

  const noteData = {
    firebaseUid: payload.uid,
    timestamp: parsed.data.timestamp,
    text: parsed.data.text,
    videoId: parsed.data.videoId,
    courseId: parsed.data.courseId,
  };

  const created = await createNote(noteData);

  return NextResponse.json(
    { success: true, note: created },
    { status: 201 }
  );
});
