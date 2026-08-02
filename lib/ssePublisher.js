import { Redis } from "@upstash/redis";

const SSE_TTL_SECONDS = 24 * 60 * 60;
const MEMORY_TTL_MS = 5 * 60 * 1000;

let redisClient;
const memoryEvents = [];
let memorySequence = 0;

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

  const timestamp = Date.now();

  let sequence;

  if (redis) {
    sequence = await redis.incr(`${key}:sequence`);

    const member = JSON.stringify({
      event,
      payload,
      _timestamp: timestamp,
      _sequence: sequence,
      _id: sequence.toString(),
    });

    await redis.zadd(key, {
      score: sequence,
      member,
    });

    await redis.expire(key, SSE_TTL_SECONDS);
  } else {
    sequence = ++memorySequence;

    const member = JSON.stringify({
      event,
      payload,
      _timestamp: timestamp,
      _sequence: sequence,
      _id: sequence.toString(),
    });

    memoryEvents.push({
      key,
      member,
      score: sequence,
      expiresAt: Date.now() + MEMORY_TTL_MS,
    });

    const cutoff = Date.now() - MEMORY_TTL_MS;

    while (
      memoryEvents.length > 0 &&
      memoryEvents[0].expiresAt < cutoff
    ) {
      memoryEvents.shift();
    }
  }
}

export async function pollEvents(channel, sinceSequence = 0, limit = 50) {
  const redis = getRedis();
  const key = `sse:events:${channel}`;

  if (redis) {
    const members = await redis.zrange(
      key,
      sinceSequence + 1,
      "+inf",
      {
        byScore: true,
        rev: false,
      }
    );

    return members
      .map((m) => (typeof m === "string" ? JSON.parse(m) : m))
      .slice(0, limit);
  }

  return memoryEvents
    .filter((e) => e.key === key && e.score > sinceSequence)
    .map((e) => JSON.parse(e.member))
    .slice(0, limit);
}
