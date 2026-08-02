/**
 * Study Rooms API - CRUD operations for study rooms.
 * Handles room creation, listing, and management.
 *
 * Issue: #4222
 */
import { z } from "zod";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rateLimit";
import { createRoom, getRoom, endRoom } from "@/lib/studyRoomManager";
import { connectDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  courseId: z.string().optional(),
});

export const GET = withErrorHandler(async (request) => {
  const token = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const status = searchParams.get("status") || "active";

  if (roomId) {
    const room = await getRoom(roomId);
    if (!room) {
      return jsonError("Room not found", 404);
    }
    return jsonSuccess({ room });
  }

  const db = await connectDb();
  const query = { status };
  if (token.role === "student") {
    query.$or = [{ hostId: token.uid }, { "settings.allowJoin": true }];
  }

  const rooms = await db
    .collection("study_rooms")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return jsonSuccess({ rooms });
});

export const POST = withErrorHandler(async (request) => {
  const token = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`study_room_create_${ip}_${token.uid}`);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024);
  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request payload", 400);
  }

  const room = await createRoom({
    name: parsed.data.name,
    hostId: token.uid,
    hostName: token.name || token.email || "Unknown",
    courseId: parsed.data.courseId,
    description: parsed.data.description || "",
  });

  return jsonSuccess({ room }, 201);
});
