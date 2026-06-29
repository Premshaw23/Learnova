import { getRedis } from "./redis";
import logger from "@/utils/logger";

// ============================================================================
// ⚙️ CONFIGURATION CONSTANTS (Issue #3256)
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 50;     // Upgraded to 50

// ─── In-memory fallback rate limiter ──────────────────────────────────────────
// Used when Upstash Redis is unreachable.
// Has a STRICTER limit (3 requests/min instead of 50) to compensate for the
// lack of a shared store and to minimize abuse during an outage.
const IN_MEMORY_FALLBACK_WINDOW_MS = 60 * 1000;
const IN_MEMORY_FALLBACK_MAX = 3;

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
    return { allowed: true, remaining: IN_MEMORY_FALLBACK_MAX - 1 };
  }

  const timestamps = fallbackRateLimitMap.get(userId);
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= IN_MEMORY_FALLBACK_MAX) {
    fallbackRateLimitMap.set(userId, validTimestamps);
    return { allowed: false, remaining: 0 };
  }

  validTimestamps.push(now);
  fallbackRateLimitMap.set(userId, validTimestamps);
  
  return { 
    allowed: true, 
    remaining: IN_MEMORY_FALLBACK_MAX - validTimestamps.length 
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
  } catch (err) {
    // 5. Circuit Breaker Triggered
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error("Rate Limiter: Redis failed, tripping Circuit Breaker", { error: errMsg, userId });
    console.warn("[rate-limit] Redis unavailable, tripping Circuit Breaker to in-memory fallback:", errMsg);
    
    return checkRateLimitFallback(userId);
  }
}

// ============================================================================
// 🛡️ IP EXTRACTION & VALIDATION
// ============================================================================
/**
 * Extracts the real client IP from a request in a secure manner.
 * - Prefers x-real-ip (set by reverse proxy, not user-controllable).
 * - Falls back to the rightmost IP in x-forwarded-for (appended by the last proxy).
 * - Rejects private/loopback IPs to prevent spoofing.
 */
function extractClientIp(req) {
  const realIp = req.headers['x-real-ip'];
  if (realIp && isValidPublicIp(realIp)) {
    return realIp;
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim()).filter(Boolean);
    const rightmost = ips[ips.length - 1];
    if (rightmost && isValidPublicIp(rightmost)) {
      return rightmost;
    }
    // Fall back to any valid public IP in the chain
    for (const ip of ips) {
      if (isValidPublicIp(ip)) return ip;
    }
  }

  return null;
}

/**
 * Validates that an IP is a legitimate public IP (not loopback, private, or reserved).
 */
function isValidPublicIp(ip) {
  if (!ip) return false;
  // IPv4 validation with private/reserved range rejection
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const parts = ipv4Match.slice(1).map(Number);
    if (parts.some(p => p < 0 || p > 255)) return false;
    const [a, b, c, d] = parts;
    // Reject private, loopback, link-local, and reserved ranges
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 0) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 198 && b === 18 && c === 0 && d === 0) return false;
    if (a === 198 && b === 51 && c === 100) return false;
    if (a >= 224) return false;
    return true;
  }
  // Allow IPv6 loopback ::1 in dev, reject everything else
  if (ip === '::1') return false;
  if (ip.includes(':')) return false; // reject all other IPv6 for rate limiting
  return false;
}

// ============================================================================
// 🛡️ EXPRESS / NEXT.JS MIDDLEWARE EXPORT
// ============================================================================
/**
 * Optional Wrapper for easy injection into standard API routes.
 *
 * When the rate limiter encounters an unexpected error:
 * - Default (fail-closed): Returns 503 Service Unavailable
 * - Opt-in (fail-open): Set RATE_LIMIT_FAIL_OPEN=true to let requests through
 */
export const rateLimitMiddleware = async (req, res, next) => {
  try {
    const identifier = req.user?.id || extractClientIp(req) || 'anonymous';
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

    if (process.env.RATE_LIMIT_FAIL_OPEN === 'true') {
      // Fail open: let the request through if the entire limiter crashes
      // Only use this in development or when availability is critical
      logger.warn('[RateLimiter] Fail-open mode enabled, allowing request');
      next();
    } else {
      // Fail closed: reject the request if rate limiting cannot be enforced
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Rate limiting service is temporarily unavailable. Please try again later.',
      });
    }
  }
};