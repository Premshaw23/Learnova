import { getRedis } from "./redis";
import { randomUUID } from "crypto";
import { logger } from "./logger";

// Returns true if Redis credentials are not configured
function isRedisConfigured() {
  return (
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// When true, allows session bypass if Redis is unavailable (fail-open).
// Default: false (fail-closed — reject requests when Redis is down).
function shouldBypassOnFailure() {
  return process.env.SESSION_BYPASS_ON_FAILURE === "true";
}

export async function createSession(userId, metadata = {}) {
  if (!isRedisConfigured()) {
    if (shouldBypassOnFailure()) {
      logger.warn("Session bypass: Redis not configured", { userId });
      return "local-bypass-session";
    }
    logger.error("Session creation blocked: Redis not configured", { userId });
    throw new Error("Session management unavailable");
  }

  const redis = getRedis();

  // Terminate concurrent sessions (prevent concurrent login)
  const existingSessions = await redis.smembers(`user:sessions:${userId}`);
  if (existingSessions && existingSessions.length > 0) {
    const pipeline = redis.multi();
    existingSessions.forEach((sid) => pipeline.del(`session:${sid}`));
    pipeline.del(`user:sessions:${userId}`);
    await pipeline.exec();
  }

  const sessionId = randomUUID();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    ...metadata,
  };

  const multi = redis.multi();
  multi.set(`session:${sessionId}`, sessionData, { ex: 24 * 60 * 60 });
  multi.sadd(`user:sessions:${userId}`, sessionId);
  multi.expire(`user:sessions:${userId}`, 24 * 60 * 60);
  await multi.exec();

  return sessionId;
}

export async function validateSession(sessionId) {
  if (!isRedisConfigured()) {
    if (shouldBypassOnFailure() || sessionId === "local-bypass-session") {
      return true;
    }
    logger.warn("Session validation failed: Redis not configured", {
      sessionId,
    });
    return false;
  }

  const redis = getRedis();

  const exists = await redis.exists(`session:${sessionId}`);
  return exists === 1;
}

export async function terminateSession(sessionId) {
  if (!isRedisConfigured() || sessionId === "local-bypass-session") return;
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
  if (!isRedisConfigured()) return;
  const redis = getRedis();

  const existingSessions = await redis.smembers(`user:sessions:${userId}`);
  if (existingSessions && existingSessions.length > 0) {
    const pipeline = redis.multi();
    existingSessions.forEach((sid) => pipeline.del(`session:${sid}`));
    pipeline.del(`user:sessions:${userId}`);
    await pipeline.exec();
  }
}
