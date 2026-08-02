import { getRedis } from "./redis";
import { randomUUID } from "crypto";

// Returns true if session management should be bypassed
function shouldBypass() {
  return (
    !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

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
  const ttlSeconds = 24 * 60 * 60;

  await redis.eval(CREATE_SESSION_SCRIPT, [`user:sessions:${userId}`],
    [sessionId, JSON.stringify(sessionData), String(ttlSeconds)]);

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

  const rawSessionData = await redis.get(`session:${sessionId}`);
  if (!rawSessionData) return;

  const sessionData = JSON.parse(rawSessionData);
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
