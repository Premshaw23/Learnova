import { getRedis } from "./redis";
import { randomUUID } from "crypto";
import { SESSION_TTL_SECONDS } from "./sessionConstants";

// Returns true if session management should be bypassed
function shouldBypass() {
  return (
    !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// Atomically terminates any existing sessions for the user and creates a new
// one, all in a single server-side step. This closes the read-then-write race
// that existed when "read existing session ids" and "delete + create" were
// separate round-trips: two concurrent logins could both read the same
// (possibly empty) session set before either had written, and both would
// then create a session, leaving two simultaneously valid sessions for the
// same user.
//
// KEYS[1] = user:sessions:{userId}
// ARGV[1] = new sessionId
// ARGV[2] = JSON-serialized session data to store under session:{sessionId}
// ARGV[3] = session TTL in seconds
const CREATE_SESSION_SCRIPT = `
  local userSessionsKey = KEYS[1]
  local newSessionId = ARGV[1]
  local sessionData = ARGV[2]
  local ttlSeconds = tonumber(ARGV[3])

  local existingSessions = redis.call("SMEMBERS", userSessionsKey)
  for _, sid in ipairs(existingSessions) do
    redis.call("DEL", "session:" .. sid)
  end
  redis.call("DEL", userSessionsKey)

  redis.call("SET", "session:" .. newSessionId, sessionData, "EX", ttlSeconds)
  redis.call("SADD", userSessionsKey, newSessionId)
  redis.call("EXPIRE", userSessionsKey, ttlSeconds)

  return newSessionId
`;

export async function createSession(userId, metadata = {}) {
  const redis = getRedis();
  if (shouldBypass()) return "local-bypass-session";

  const sessionId = randomUUID();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    ...metadata,
  };
  const ttlSeconds = SESSION_TTL_SECONDS;

  await redis.eval(
    CREATE_SESSION_SCRIPT,
    [`user:sessions:${userId}`],
    [sessionId, JSON.stringify(sessionData), String(ttlSeconds)]
  );

  return sessionId;
}

export async function validateSession(sessionId) {
  if (shouldBypass() || sessionId === "local-bypass-session") return true;
  const redis = getRedis();

  const exists = await redis.exists(`session:${sessionId}`);
  return exists === 1;
}

export async function terminateSession(sessionId) {
  if (shouldBypass() || sessionId === "local-bypass-session") return;
  const redis = getRedis();

  const sessionData = await redis.get(`session:${sessionId}`);
  if (!sessionData) return;

  const userId = sessionData.userId;

  const multi = redis.multi();
  multi.del(`session:${sessionId}`);
  if (userId) {
    multi.srem(`user:sessions:${userId}`, sessionId);
  }
  await multi.exec();
}

export async function terminateAllUserSessions(userId) {
  if (shouldBypass()) return;
  const redis = getRedis();

  const existingSessions = await redis.smembers(`user:sessions:${userId}`);
  if (existingSessions && existingSessions.length > 0) {
    const pipeline = redis.multi();
    existingSessions.forEach((sid) => pipeline.del(`session:${sid}`));
    pipeline.del(`user:sessions:${userId}`);
    await pipeline.exec();
  }
}