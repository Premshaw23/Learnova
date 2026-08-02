/**
 * Study Room Events - Event types and handlers for real-time room communication.
 * Uses Redis pub/sub for broadcasting room events to all participants.
 *
 * Issue: #4222
 */
import { getRedis } from "./redis";
import { publishEvent } from "./ssePublisher";

// Event types for study rooms
export const ROOM_EVENTS = {
  // Participant events
  PARTICIPANT_JOINED: "participant_joined",
  PARTICIPANT_LEFT: "participant_left",
  PARTICIPANT_TYPING: "participant_typing",
  PARTICIPANT_CURSOR: "participant_cursor",

  // Chat events
  MESSAGE_SENT: "message_sent",
  MESSAGE_DELETED: "message_deleted",

  // Whiteboard events
  WHITEBOARD_UPDATE: "whiteboard_update",
  WHITEBOARD_CLEAR: "whiteboard_clear",

  // Editor events
  EDITOR_UPDATE: "editor_update",
  EDITOR_CURSOR: "editor_cursor",

  // Quiz events
  QUIZ_STARTED: "quiz_started",
  QUIZ_BUZZ: "quiz_buzz",
  QUIZ_ANSWER: "quiz_answer",
  QUIZ_ENDED: "quiz_ended",

  // Timer events
  TIMER_STARTED: "timer_started",
  TIMER_PAUSED: "timer_paused",
  TIMER_RESET: "timer_reset",
  TIMER_TICK: "timer_tick",

  // Room events
  ROOM_UPDATED: "room_updated",
  ROOM_CLOSED: "room_closed",
};

/**
 * Publish a room event to Redis for real-time delivery.
 * Also stores the event in SSE sorted set for polling clients.
 */
export async function publishRoomEvent(roomId, eventType, payload, senderId = null) {
  const event = {
    type: eventType,
    roomId,
    senderId,
    payload,
    timestamp: Date.now(),
  };

  // Publish to Redis pub/sub for real-time subscribers
  const redis = getRedis();
  if (redis) {
    try {
      await redis.publish(`study-room:${roomId}`, JSON.stringify(event));
    } catch (err) {
      console.error("[StudyRoom] Redis publish failed:", err.message);
    }
  }

  // Also publish to SSE sorted set for polling clients
  await publishEvent(`study-room:${roomId}`, eventType, event);

  return event;
}

/**
 * Subscribe to room events. Returns an unsubscribe function.
 * Since Upstash Redis doesn't support true pub/sub over REST,
 * we use SSE polling as the primary mechanism.
 */
export function subscribeToRoomEvents(roomId, callback) {
  const channel = `study-room:${roomId}`;
  let lastPollTime = Date.now();
  let pollInterval = null;
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const { pollEvents } = await import("./ssePublisher");
      const events = await pollEvents(channel, lastPollTime);

      if (events.length > 0) {
        lastPollTime = Date.now();
        events.forEach((event) => {
          if (event.payload) {
            callback(event.payload);
          }
        });
      }
    } catch (err) {
      console.error("[StudyRoom] Poll error:", err.message);
    }
  };

  // Poll every 1 second for real-time updates
  pollInterval = setInterval(poll, 1000);
  poll(); // Initial poll

  return () => {
    isActive = false;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}
