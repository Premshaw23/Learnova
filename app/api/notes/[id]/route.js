import { NextResponse } from "next/server";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { updateNoteSchema } from "@/lib/validations/notes";
import { updateNote, deleteNote } from "@/lib/models/noteModel";

export const dynamic = "force-dynamic";

async function getRouteId(context) {
  const params = await context.params;
  return params?.id;
}

export const PUT = withErrorHandler(async (request, context) => {
  const payload = await requireAuth(request);
  const noteId = await getRouteId(context);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`note_update_${ip}_${payload.uid}`);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await parseJSON(request, 1024 * 50);
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0]?.message || "Invalid payload";
    return NextResponse.json({ success: false, error: first }, { status: 400 });
  }

  const updated = await updateNote(noteId, payload.uid, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { success: false, error: "Note not found or unauthorized" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, note: updated });
});

export const DELETE = withErrorHandler(async (request, context) => {
  const payload = await requireAuth(request);
  const noteId = await getRouteId(context);

  const deleted = await deleteNote(noteId, payload.uid);
  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Note not found or unauthorized" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, message: "Note deleted successfully" });
});
