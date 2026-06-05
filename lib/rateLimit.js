import { connectDb } from "./mongodb";
import { Redis } from "@upstash/redis";
import logger from "@/utils/logger";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

let indexEnsured = false;

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

async function ensureIndexes(collection) {
  if (indexEnsured) return;
  await collection.createIndex({ userId: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  indexEnsured = true;
}

// ─── In-memory fallback rate limiter ──────────────────────────────────────────
// Used when both MongoDB and Upstash Redis are unreachable.
// Has a STRICTER limit (3 requests/min instead of 10) to compensate for the
// lack of a shared store and to minimize abuse during an outage.
const IN_MEMORY_FALLBACK_WINDOW_MS = 60 * 1000;
const IN_MEMORY_FALLBACK_MAX = 3;
const MAX_FALLBACK_ENTRIES = 10000;
const fallbackMap = new Map();

function checkInMemoryFallback(userId) {
  const now = Date.now();
  const key = `fallback:${userId}`;
  const entry = fallbackMap.get(key);

  if (!entry || now > entry.resetTime) {
    if (fallbackMap.size >= MAX_FALLBACK_ENTRIES && !fallbackMap.has(key)) {
      const oldestKey = fallbackMap.keys().next().value;
      if (oldestKey !== undefined) {
        fallbackMap.delete(oldestKey);
      }
    }
    fallbackMap.set(key, {
      count: 1,
      resetTime: now + IN_MEMORY_FALLBACK_WINDOW_MS,
    });
    return { allowed: true, remaining: IN_MEMORY_FALLBACK_MAX - 1 };
  }

  if (entry.count >= IN_MEMORY_FALLBACK_MAX) {
    fallbackMap.delete(key);
    fallbackMap.set(key, entry);
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  fallbackMap.delete(key);
  fallbackMap.set(key, entry);
  return { allowed: true, remaining: IN_MEMORY_FALLBACK_MAX - entry.count };
}

// Periodically evict stale entries from the fallback map to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fallbackMap.entries()) {
    if (now > entry.resetTime) {
      fallbackMap.delete(key);
    }
  }
}, 60 * 1000).unref();

export async function checkRateLimit(userId) {
  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  // Redis is the primary rate-limit store — purpose-built for this with
  // atomic operations and native TTL. Using it first eliminates the
  // MongoDB-failure → fresh-Redis-counter bypass that existed when
  // MongoDB was tried first.
  if (hasRedis) {
    try {
      const redis = getRedis();
      const key = `ratelimit:api:${userId}`;
      const now = Date.now();
      const windowStart = now - RATE_LIMIT_WINDOW_MS;

      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      multi.zcard(key);
      multi.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
      const [, , count] = await multi.exec();

      const current = Number(count);
      if (current > MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false, remaining: 0 };
      }

      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - current };
    } catch (redisErr) {
      const redisErrMsg = redisErr instanceof Error ? redisErr.message : String(redisErr);
      logger.error("Rate Limiter: Redis failed, falling back to MongoDB", { error: redisErrMsg, userId });
      console.error("[rate-limit] Redis failed — falling back to MongoDB:", redisErr);
    }
  }

  // MongoDB fallback (used when Redis is not configured or has failed)
  try {
    const db = await connectDb();
    if (!db || typeof db.collection !== "function") {
      console.error(
        "[rate-limit] MongoDB unavailable — rate limiting disabled"
      );
      throw new Error("MongoDB unavailable");
    }
    const collection = db.collection("rate_limits");

    await ensureIndexes(collection);

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    await collection.updateOne(
      { userId },
      {
        $push: {
          requests: {
            $each: [now],
            $slice: -(MAX_REQUESTS_PER_WINDOW + 1),
          },
        },
        $set: {
          expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS * 2),
        },
        $setOnInsert: {
          userId,
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const updated = await collection.findOne({ userId });
    const recentRequests = (updated?.requests ?? []).filter(
      (t) => new Date(t) >= windowStart
    );

    if (recentRequests.length > MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - recentRequests.length,
    };
  } catch (mongoErr) {
    const mongoErrMsg = mongoErr instanceof Error ? mongoErr.message : String(mongoErr);
    logger.error("Rate Limiter degraded to in-memory: MongoDB failed", { error: mongoErrMsg, userId });
    console.error("[rate-limit] MongoDB failed — falling back to in-memory limiter:", mongoErrMsg);
    return checkInMemoryFallback(userId);
  }
}
