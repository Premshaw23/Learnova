import { getRedis } from "./lockManager";
import { randomUUID } from "crypto";

// Returns true if session management should be bypassed
function shouldBypass() {
  return !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;
}

export async function createSession(userId, metadata = {}) {
  const redis = getRedis();
  if (shouldBypass()) return "local-bypass-session";

  // Terminate concurrent sessions (prevent concurrent login)
  const existingSessions = await redis.smembers(`user:sessions:${userId}`);
  if (existingSessions && existingSessions.length > 0) {
    const pipeline = redis.multi();
    existingSessions.forEach(sid => pipeline.del(`session:${sid}`));
    pipeline.del(`user:sessions:${userId}`);
    await pipeline.exec();
  }

  const sessionId = randomUUID();
  const sessionData = {
    userId,
    createdAt: Date.now(),
    ...metadata
  };

  const multi = redis.multi();
  multi.set(`session:${sessionId}`, sessionData, { ex: 24 * 60 * 60 });
  multi.sadd(`user:sessions:${userId}`, sessionId);
  multi.expire(`user:sessions:${userId}`, 24 * 60 * 60);
  await multi.exec();

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
    existingSessions.forEach(sid => pipeline.del(`session:${sid}`));
    pipeline.del(`user:sessions:${userId}`);
    await pipeline.exec();
  }
}
