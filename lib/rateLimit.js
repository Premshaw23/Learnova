import { Redis } from "@upstash/redis";
import logger from "@/utils/logger";

// ============================================================================
// ⚙️ CONFIGURATION CONSTANTS (Issue #3256)
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 50;     // Upgraded to 50

// ============================================================================
// 🔌 REDIS INITIALIZATION
// ============================================================================
let redisClient;

function getRedis() {
  if (!redisClient && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

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
    // Prevent infinite map growth during a massive DDoS attack
    if (fallbackRateLimitMap.size >= MAX_FALLBACK_ENTRIES) {
      const oldestKey = fallbackRateLimitMap.keys().next().value;
      fallbackRateLimitMap.delete(oldestKey);
    }
    fallbackRateLimitMap.set(userId, [now]);
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  const timestamps = fallbackRateLimitMap.get(userId);
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    fallbackRateLimitMap.set(userId, validTimestamps);
    return { allowed: false, remaining: 0 };
  }

  validTimestamps.push(now);
  fallbackRateLimitMap.set(userId, validTimestamps);
  
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length 
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

  // 1. If Redis client failed to initialize, immediately use Circuit Breaker
  if (!redis) {
    return checkRateLimitFallback(userId);
  }

  try {
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const redisKey = `rate_limit:user:${userId}`;

    // 2. Execute Atomic Redis Pipeline
    const pipeline = redis.pipeline();
    
    // Remove timestamps older than our 60-second window
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count how many requests are currently in the valid window
    pipeline.zcard(redisKey);
    
    // Add the current request with a unique member ID to prevent overwriting
    const uniqueMemberId = `${now}_${Math.random().toString(36).substring(2, 8)}`;
    pipeline.zadd(redisKey, { score: now, member: uniqueMemberId });
    
    // Set the key to expire so we don't leak memory in Redis
    pipeline.pexpire(redisKey, RATE_LIMIT_WINDOW_MS);

    // Await the pipeline execution
    const results = await pipeline.exec();
    
    // 3. Evaluate the results
    const currentRequestCount = results[1];

    // If the count BEFORE adding this request is >= the limit, block them.
    if (currentRequestCount >= MAX_REQUESTS_PER_WINDOW) {
      await redis.zrem(redisKey, uniqueMemberId); // Clean up rejected request
      return { allowed: false, remaining: 0 };
    }

    // 4. Success! Allow the request
    return {
      allowed: true,
      remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - currentRequestCount - 1),
    };
  } catch (mongoErr) {
    const mongoErrMsg = mongoErr instanceof Error ? mongoErr.message : String(mongoErr);
    logger.error("Rate Limiter: MongoDB failed, retrying Redis fallback", { error: mongoErrMsg, userId });
    console.error("[rate-limit] MongoDB failed — retrying Redis fallback:", mongoErrMsg);

  } catch (err) {
    const hasRedis =
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN;

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
        const redisErrMsg =
          redisErr instanceof Error ? redisErr.message : String(redisErr);
        logger.error(
          "Rate Limiter degraded to in-memory: Both MongoDB and Upstash Redis failed",
          { error: redisErrMsg, userId }
        );
        console.error(
          "[rate-limit] Both MongoDB and Upstash Redis failed — falling back to in-memory limiter:",
          redisErr
        );
        return checkInMemoryFallback(userId);
      }
    }

    logger.error(
      "Rate Limiter degraded to in-memory: MongoDB failed, no Upstash Redis configured",
      { error: mongoErrMsg, userId }
    );
    console.error(
      "[rate-limit] MongoDB failed and no Upstash Redis configured — falling back to in-memory limiter:",
      mongoErrMsg
    );
    logger.error("Rate Limiter degraded to in-memory: MongoDB failed", { error: mongoErrMsg, userId });
    console.error("[rate-limit] MongoDB failed — falling back to in-memory limiter:", mongoErrMsg);
    return checkInMemoryFallback(userId);
    if (!hasRedis) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(
        "Rate Limiter degraded to in-memory: MongoDB failed, no Upstash Redis configured",
        { error: errMsg, userId }
      );
      console.error(
        "[rate-limit] MongoDB failed and no Upstash Redis configured — falling back to in-memory limiter:",
        errMsg
      );
      return checkInMemoryFallback(userId);
    }

  } catch (err) {
    // 5. Circuit Breaker Triggered
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error("Rate Limiter: Redis failed, tripping Circuit Breaker", { error: errMsg, userId });
    console.warn("[rate-limit] Redis unavailable, tripping Circuit Breaker to in-memory fallback:", errMsg);
    
    return checkRateLimitFallback(userId);
  }
}

// ============================================================================
// 🛡️ EXPRESS / NEXT.JS MIDDLEWARE EXPORT
// ============================================================================
/**
 * Optional Wrapper for easy injection into standard API routes.
 */
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    const identifier = req.user?.id || req.headers['x-forwarded-for'] || 'anonymous';
    const result = await checkRateLimit(identifier);

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      });
    }

    next();
  } catch (error) {
    logger.error('[RateLimiter Middleware Error]', error);
    // Fail open: let the request through if the entire limiter crashes
    next();
  }
};