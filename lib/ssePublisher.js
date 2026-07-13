import { Redis } from "@upstash/redis";

const SSE_TTL_SECONDS = 24 * 60 * 60;
const MEMORY_TTL_MS = 5 * 60 * 1000;

let redisClient;
const memoryEvents = [];

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export async function publishEvent(channel, event, payload) {
  const redis = getRedis();
  const key = `sse:events:${channel}`;
  const score = Date.now();
  const member = JSON.stringify({
    event,
    payload,
    _timestamp: score,
    _id: score.toString(36) + Math.random().toString(36).slice(2, 8),
  });

  if (redis) {
    await redis.zadd(key, { score, member });
    await redis.expire(key, SSE_TTL_SECONDS);
  } else {
    memoryEvents.push({ key, member, score, expiresAt: Date.now() + MEMORY_TTL_MS });
    const cutoff = Date.now() - MEMORY_TTL_MS;
    while (memoryEvents.length > 0 && memoryEvents[0].score < cutoff) {
      memoryEvents.shift();
    }
  }
}

export async function pollEvents(channel, since, limit = 50) {
  const redis = getRedis();
  const key = `sse:events:${channel}`;
  const lastScore = since instanceof Date ? since.getTime() : since;

  if (redis) {
    const members = await redis.zrange(key, lastScore + 1, "+inf", {
      byScore: true,
      rev: false,
    });
    return members.map((m) => (typeof m === "string" ? JSON.parse(m) : m)).slice(0, limit);
  }

  return memoryEvents
    .filter((e) => e.key === key && e.score > lastScore)
    .map((e) => JSON.parse(e.member))
    .slice(0, limit);
}
