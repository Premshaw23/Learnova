/**
 * Study Room Messages API - Message history and sending.
 *
 * Issue: #4222
 */
export const dynamic = "force-dynamic";

import { z } from "zod";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { sendMessage, getMessages } from "@/lib/studyRoomManager";
import { checkRateLimit } from "@/lib/rateLimit";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const GET = withErrorHandler(async (request, { params }) => {
  await requireAuth(request);
  const { roomId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const before = searchParams.get("before");
  const messages = await getMessages(roomId, limit, before);
  return jsonSuccess({ messages });
});

export const POST = withErrorHandler(async (request, { params }) => {
  const token = await requireAuth(request);
  const { roomId } = await params;
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`study_room_msg_${ip}_${token.uid}`);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many messages. Please slow down.", 429);
  }
  const body = await parseJSON(request, 2048);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid message content", 400);
  }
  const message = await sendMessage(
    roomId,
    token.uid,
    token.name || token.email || "Student",
    parsed.data.content
  );
  return jsonSuccess({ message }, 201);
});
