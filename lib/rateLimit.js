import { connectDb } from "./mongodb";
import { getRedis } from "./redis";
import logger from "@/utils/logger";

// ============================================================================
// ⚙️ CONFIGURATION CONSTANTS (Issue #3256)
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 50; // Upgraded to 50

// ─── In-memory fallback rate limiter ──────────────────────────────────────────
// Used when both MongoDB and Upstash Redis are unreachable.
// Has a STRICTER limit (3 requests/min instead of 10) to compensate for the
// lack of a shared store and to minimize abuse during an outage.
const IN_MEMORY_FALLBACK_WINDOW_MS = 60 * 1000;
const IN_MEMORY_FALLBACK_MAX = 3;
// ============================================================================
// 🔌 REDIS INITIALIZATION
// ============================================================================
// ============================================================================
// 🛟 CIRCUIT BREAKER: ADVANCED IN-MEMORY FALLBACK
// ============================================================================
const fallbackRateLimitMap = new Map();
let lastCleanupTime = Date.now();
const MAP_CLEANUP_INTERVAL_MS = 60 * 1000;
const MAX_FALLBACK_ENTRIES = 10000;

/**
 * Fallback sliding-window rate limiter using local server memory.
 * Ensures the API stays online even if Redis completely crashes.
 */
function checkRateLimitFallback(userId) {
  const now = Date.now();

  // Periodically clean up the entire map to prevent memory leaks from inactive users
  if (now - lastCleanupTime > MAP_CLEANUP_INTERVAL_MS) {
    for (const [key, timestamps] of fallbackRateLimitMap.entries()) {
      const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        fallbackRateLimitMap.delete(key);
      } else if (active.length !== timestamps.length) {
        fallbackRateLimitMap.set(key, active);
      }
    }
    lastCleanupTime = now;
  }

  if (!fallbackRateLimitMap.has(userId)) {
    if (fallbackRateLimitMap.size >= MAX_FALLBACK_ENTRIES) {
      const oldestKey = fallbackRateLimitMap.keys().next().value;
      fallbackRateLimitMap.delete(oldestKey);
    }
    fallbackRateLimitMap.set(userId, [now]);
    return { allowed: true, remaining: IN_MEMORY_FALLBACK_MAX - 1 };
  }

  const timestamps = fallbackRateLimitMap.get(userId);
  const validTimestamps = timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (validTimestamps.length >= IN_MEMORY_FALLBACK_MAX) {
    fallbackRateLimitMap.set(userId, validTimestamps);
    return { allowed: false, remaining: 0 };
  }

  validTimestamps.push(now);
  fallbackRateLimitMap.set(userId, validTimestamps);

  return {
    allowed: true,
    remaining: IN_MEMORY_FALLBACK_MAX - validTimestamps.length,
  };
}

// ============================================================================
// 🚀 CORE REDIS SLIDING-WINDOW ENGINE
// ============================================================================
/**
 * Main Rate Limiter Function exported to the rest of the application.
 * Replaces the old MongoDB logic with a high-performance Redis Pipeline.
 * @param {string} userId - The unique identifier for the requester.
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
export async function checkRateLimit(userId) {
  const now = Date.now();
  const redis = getRedis();

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      const redis = getRedis();
      const key = `ratelimit:api:${userId}`;
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
    } catch (err) {
      logger.error("Rate Limiter: Redis failed, falling back to in-memory", {
        error: err instanceof Error ? err.message : String(err),
        userId,
      });
    }
  }

  return checkRateLimitFallback(userId);
}

// ============================================================================
// 🛡️ EXPRESS / NEXT.JS MIDDLEWARE EXPORT
// ============================================================================
/**
 * Optional Wrapper for easy injection into standard API routes.
 */
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    const identifier =
      req.user?.id || req.headers["x-forwarded-for"] || "anonymous";
    const result = await checkRateLimit(identifier);

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW);
    res.setHeader("X-RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
      res.setHeader("Retry-After", Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
      return res.status(429).json({
        error: "Too Many Requests",
        message: "You have exceeded the rate limit. Please try again later.",
      });
    }

    next();
  } catch (error) {
    logger.error("[RateLimiter Middleware Error]", error);
    // Fail open: let the request through if the entire limiter crashes
    next();
  }
};
