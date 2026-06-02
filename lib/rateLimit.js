import { connectDb } from "./mongodb";
import { Redis } from "@upstash/redis";
import logger from "@/utils/logger";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

export const RATE_LIMIT_POLICIES = {
  RESET_PASSWORD: { maxRequests: 3, windowMs: 15 * 60 * 1000 },      // 3 attempts per 15 minutes
  SET_ROLE: { maxRequests: 5, windowMs: 15 * 60 * 1000 },            // 5 attempts per 15 minutes
  VALIDATE_PASSCODE: { maxRequests: 5, windowMs: 10 * 60 * 1000 },   // 5 attempts per 10 minutes
};

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

function checkInMemoryFallback(userId, windowMs = IN_MEMORY_FALLBACK_WINDOW_MS, maxLimit = IN_MEMORY_FALLBACK_MAX) {
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
    fallbackMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxLimit - 1 };
  }

  if (entry.count >= maxLimit) {
    fallbackMap.delete(key);
    fallbackMap.set(key, entry);
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  fallbackMap.delete(key);
  fallbackMap.set(key, entry);
  return { allowed: true, remaining: maxLimit - entry.count };
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

export async function checkRateLimit(userId, options = {}) {
  const windowMs = options.windowMs || RATE_LIMIT_WINDOW_MS;
  const maxRequests = options.maxRequests || MAX_REQUESTS_PER_WINDOW;
  const fallbackMax = options.fallbackMax || Math.max(1, Math.min(Math.floor(maxRequests * 0.3), IN_MEMORY_FALLBACK_MAX));

  try {
    const db = await connectDb();
    if (!db || typeof db.collection !== "function") {
      console.error("[rate-limit] MongoDB unavailable — rate limiting disabled");
      throw new Error("MongoDB unavailable");
    }
    const collection = db.collection("rate_limits");

    await ensureIndexes(collection);

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    const updateResult = await collection.updateOne(
      { userId },
      {
        $push: {
          requests: {
            $each: [now],
            $slice: -(maxRequests + 1),
          },
        },
        $set: {
          expiresAt: new Date(now.getTime() + windowMs * 2),
        },
      },
    );

    if (updateResult.matchedCount === 0) {
      await collection.updateOne(
        { userId },
        {
          $set: {
            requests: [now],
            expiresAt: new Date(now.getTime() + windowMs * 2),
            userId,
          },
        },
        { upsert: true },
      );
    }

    const updated = await collection.findOne({ userId });
    const recentRequests = (updated?.requests ?? []).filter(
      (t) => new Date(t) >= windowStart
    );

    if (recentRequests.length > maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length,
    };
  } catch (err) {
    const hasRedis =
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!hasRedis) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("Rate Limiter degraded to in-memory: MongoDB failed, no Upstash Redis configured", { error: errMsg, userId });
      console.error(
        "[rate-limit] MongoDB failed and no Upstash Redis configured — falling back to in-memory limiter:",
        errMsg
      );
      return checkInMemoryFallback(userId, windowMs, fallbackMax);
    }

    try {
      const redis = getRedis();
      const key = `ratelimit:api:${userId}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      multi.zcard(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      const [, , count] = await multi.exec();

      const current = Number(count);
      if (current > maxRequests) {
        return { allowed: false, remaining: 0 };
      }

      return { allowed: true, remaining: maxRequests - current };
    } catch (redisErr) {
      const redisErrMsg = redisErr instanceof Error ? redisErr.message : String(redisErr);
      logger.error("Rate Limiter degraded to in-memory: Both MongoDB and Upstash Redis failed", { error: redisErrMsg, userId });
      console.error(
        "[rate-limit] Both MongoDB and Upstash Redis failed — falling back to in-memory limiter:",
        redisErr
      );
      return checkInMemoryFallback(userId, windowMs, fallbackMax);
    }
  }
}
