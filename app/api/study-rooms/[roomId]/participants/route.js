/**
 * Study Room Participants API - Participant management (join, leave, heartbeat).
 *
 * Issue: #4222
 */
export const dynamic = "force-dynamic";

import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { joinRoom, leaveRoom, getParticipants, updateHeartbeat } from "@/lib/studyRoomManager";

export const GET = withErrorHandler(async (request, { params }) => {
  await requireAuth(request);
  const { roomId } = await params;
  const participants = await getParticipants(roomId);
  return jsonSuccess({ participants, count: participants.length });
});

export const POST = withErrorHandler(async (request, { params }) => {
  const token = await requireAuth(request);
  const { roomId } = await params;
  try {
    const participant = await joinRoom(
      roomId,
      token.uid,
      token.name || token.email || "Student",
      token.role
    );
    return jsonSuccess({ participant }, 201);
  } catch (err) {
    return jsonError(err.message, 400);
  }
});

export const PATCH = withErrorHandler(async (request, { params }) => {
  const token = await requireAuth(request);
  const { roomId } = await params;
  const body = await parseJSON(request, 512);
  if (body.action === "heartbeat") {
    await updateHeartbeat(roomId, token.uid);
    return jsonSuccess({ success: true });
  }
  return jsonError("Invalid action", 400);
});

export const DELETE = withErrorHandler(async (request, { params }) => {
  const token = await requireAuth(request);
  const { roomId } = await params;
  await leaveRoom(roomId, token.uid);
  return jsonSuccess({ success: true });
});
