/**
 * Study Room Manager - Manages room state, participants, and messages.
 * Uses MongoDB for persistence and Redis for real-time state.
 *
 * Issue: #4222
 */
import { connectDb } from "./mongodb";
import { getRedis } from "./redis";
import { publishRoomEvent, ROOM_EVENTS } from "./studyRoomEvents";
import { ObjectId } from "mongodb";

const MAX_PARTICIPANTS = 10;
const ROOM_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT_MS = 90000; // 90 seconds (3 missed heartbeats)

/**
 * Create a new study room.
 */
export async function createRoom({ name, hostId, hostName, courseId = null, description = "" }) {
  const db = await connectDb();
  const now = new Date();

  const room = {
    name,
    hostId,
    hostName,
    courseId,
    description,
    status: "active",
    maxParticipants: MAX_PARTICIPANTS,
    createdAt: now,
    updatedAt: now,
    endedAt: null,
    settings: {
      allowScreenShare: true,
      allowWhiteboard: true,
      allowQuiz: true,
      allowChat: true,
    },
    stats: {
      totalParticipants: 0,
      totalMessages: 0,
      totalDuration: 0,
    },
  };

  const result = await db.collection("study_rooms").insertOne(room);
  room._id = result.insertedId;

  // Store room state in Redis for real-time access
  const redis = getRedis();
  if (redis) {
    const roomState = {
      roomId: room._id.toString(),
      name: room.name,
      hostId: room.hostId,
      status: "active",
      participants: [],
      createdAt: now.getTime(),
    };
    await redis.set(`study-room:state:${room._id}`, JSON.stringify(roomState), { ex: ROOM_TTL_SECONDS });
  }

  return room;
}

/**
 * Get a study room by ID.
 */
export async function getRoom(roomId) {
  const db = await connectDb();
  const room = await db.collection("study_rooms").findOne({ _id: new ObjectId(roomId) });
  return room;
}

/**
 * Update a study room.
 */
export async function updateRoom(roomId, updates) {
  const db = await connectDb();
  const now = new Date();

  await db.collection("study_rooms").updateOne(
    { _id: new ObjectId(roomId) },
    { $set: { ...updates, updatedAt: now } }
  );

  // Update Redis state
  const redis = getRedis();
  if (redis) {
    const stateStr = await redis.get(`study-room:state:${roomId}`);
    if (stateStr) {
      const state = JSON.parse(stateStr);
      Object.assign(state, updates);
      await redis.set(`study-room:state:${roomId}`, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    }
  }

  await publishRoomEvent(roomId, ROOM_EVENTS.ROOM_UPDATED, { updates });
}

/**
 * End/close a study room.
 */
export async function endRoom(roomId, closedBy) {
  const db = await connectDb();
  const now = new Date();

  await db.collection("study_rooms").updateOne(
    { _id: new ObjectId(roomId) },
    { $set: { status: "ended", endedAt: now, updatedAt: now } }
  );

  // Remove Redis state
  const redis = getRedis();
  if (redis) {
    await redis.del(`study-room:state:${roomId}`);
    await redis.del(`study-room:participants:${roomId}`);
  }

  await publishRoomEvent(roomId, ROOM_EVENTS.ROOM_CLOSED, { closedBy });
}

/**
 * Join a study room.
 */
export async function joinRoom(roomId, userId, userName, userRole) {
  const db = await connectDb();
  const redis = getRedis();

  // Check room exists and is active
  const room = await getRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  if (room.status !== "active") {
    throw new Error("Room is no longer active");
  }

  // Check capacity
  const participants = await getParticipants(roomId);
  if (participants.length >= MAX_PARTICIPANTS) {
    throw new Error("Room is full");
  }

  // Check if already in room
  if (participants.some((p) => p.userId === userId)) {
    return participants.find((p) => p.userId === userId);
  }

  const participant = {
    userId,
    userName,
    userRole,
    joinedAt: Date.now(),
    lastHeartbeat: Date.now(),
    isActive: true,
    isMuted: false,
    isScreenSharing: false,
  };

  if (redis) {
    await redis.hset(`study-room:participants:${roomId}`, userId, JSON.stringify(participant));
    await redis.expire(`study-room:participants:${roomId}`, ROOM_TTL_SECONDS);

    // Update room state
    const stateStr = await redis.get(`study-room:state:${roomId}`);
    if (stateStr) {
      const state = JSON.parse(stateStr);
      state.participants = [...(state.participants || []), { userId, userName }];
      await redis.set(`study-room:state:${roomId}`, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    }
  }

  // Update stats
  await db.collection("study_rooms").updateOne(
    { _id: new ObjectId(roomId) },
    { $inc: { "stats.totalParticipants": 1 } }
  );

  await publishRoomEvent(roomId, ROOM_EVENTS.PARTICIPANT_JOINED, {
    userId,
    userName,
    userRole,
    participantCount: participants.length + 1,
  });

  return participant;
}

/**
 * Leave a study room.
 */
export async function leaveRoom(roomId, userId) {
  const redis = getRedis();

  if (redis) {
    await redis.hdel(`study-room:participants:${roomId}`, userId);

    // Update room state
    const stateStr = await redis.get(`study-room:state:${roomId}`);
    if (stateStr) {
      const state = JSON.parse(stateStr);
      state.participants = (state.participants || []).filter((p) => p.userId !== userId);
      await redis.set(`study-room:state:${roomId}`, JSON.stringify(state), { ex: ROOM_TTL_SECONDS });
    }
  }

  const participants = await getParticipants(roomId);
  await publishRoomEvent(roomId, ROOM_EVENTS.PARTICIPANT_LEFT, {
    userId,
    participantCount: participants.length,
  });
}

/**
 * Get all participants in a room.
 */
export async function getParticipants(roomId) {
  const redis = getRedis();
  if (!redis) return [];

  try {
    const participantsHash = await redis.hgetall(`study-room:participants:${roomId}`);
    if (!participantsHash) return [];

    return Object.values(participantsHash).map((p) => JSON.parse(p));
  } catch (err) {
    console.error("[StudyRoom] Get participants error:", err.message);
    return [];
  }
}

/**
 * Update participant heartbeat.
 */
export async function updateHeartbeat(roomId, userId) {
  const redis = getRedis();
  if (!redis) return;

  const participantStr = await redis.hget(`study-room:participants:${roomId}`, userId);
  if (participantStr) {
    const participant = JSON.parse(participantStr);
    participant.lastHeartbeat = Date.now();
    participant.isActive = true;
    await redis.hset(`study-room:participants:${roomId}`, userId, JSON.stringify(participant));
  }
}

/**
 * Send a message in a study room.
 */
export async function sendMessage(roomId, userId, userName, content) {
  const db = await connectDb();

  const message = {
    roomId,
    userId,
    userName,
    content,
    createdAt: new Date(),
  };

  const result = await db.collection("study_room_messages").insertOne(message);
  message._id = result.insertedId;

  // Update stats
  await db.collection("study_rooms").updateOne(
    { _id: new ObjectId(roomId) },
    { $inc: { "stats.totalMessages": 1 } }
  );

  await publishRoomEvent(roomId, ROOM_EVENTS.MESSAGE_SENT, {
    messageId: message._id.toString(),
    userId,
    userName,
    content,
    createdAt: message.createdAt,
  });

  return message;
}

/**
 * Get message history for a room.
 */
export async function getMessages(roomId, limit = 50, before = null) {
  const db = await connectDb();
  const query = { roomId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await db
    .collection("study_room_messages")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return messages.reverse();
}

/**
 * Clean up stale participants (heartbeat timeout).
 */
export async function cleanupStaleParticipants(roomId) {
  const participants = await getParticipants(roomId);
  const now = Date.now();
  const staleThreshold = now - HEARTBEAT_TIMEOUT_MS;

  for (const participant of participants) {
    if (participant.lastHeartbeat < staleThreshold) {
      await leaveRoom(roomId, participant.userId);
    }
  }
}
