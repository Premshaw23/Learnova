/**
 * Study Room Operations API - Room-specific operations (get, update, end).
 *
 * Issue: #4222
 */
export const dynamic = "force-dynamic";

import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { getRoom, updateRoom, endRoom, getParticipants } from "@/lib/studyRoomManager";

export const GET = withErrorHandler(async (request, { params }) => {
  await requireAuth(request);
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) {
    return jsonError("Room not found", 404);
  }
  const participants = await getParticipants(roomId);
  return jsonSuccess({ room, participants, participantCount: participants.length });
});

export const PATCH = withErrorHandler(async (request, { params }) => {
  const token = await requireAuth(request);
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) {
    return jsonError("Room not found", 404);
  }
  if (room.hostId !== token.uid && token.role !== "admin") {
    return jsonError("Forbidden: Only room host can update settings", 403);
  }
  const body = await parseJSON(request, 1024);
  const allowedUpdates = ["name", "description", "settings"];
  const updates = {};
  for (const key of allowedUpdates) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }
  await updateRoom(roomId, updates);
  return jsonSuccess({ success: true });
});

export const DELETE = withErrorHandler(async (request, { params }) => {
  const token = await requireAuth(request);
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) {
    return jsonError("Room not found", 404);
  }
  if (room.hostId !== token.uid && token.role !== "admin") {
    return jsonError("Forbidden: Only room host can close the room", 403);
  }
  await endRoom(roomId, token.uid);
  return jsonSuccess({ success: true });
});
