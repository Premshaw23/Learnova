import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

// In-memory store for fallback rate limiting (15 minutes window, max 5 requests)
const memoryLimiter = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

function checkMemoryLimit(ip) {
  const now = Date.now();

  // Clean up old entries from the map to prevent memory leaks
  for (const [key, timestamps] of memoryLimiter.entries()) {
    const active = timestamps.filter((t) => now - t < WINDOW_MS);
    if (active.length === 0) {
      memoryLimiter.delete(key);
    } else if (active.length !== timestamps.length) {
      memoryLimiter.set(key, active);
    }
  }

  if (!memoryLimiter.has(ip)) {
    memoryLimiter.set(ip, [now]);
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  const timestamps = memoryLimiter.get(ip);
  const activeTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS) {
    memoryLimiter.set(ip, activeTimestamps);
    return { allowed: false, remaining: 0 };
  }

  activeTimestamps.push(now);
  memoryLimiter.set(ip, activeTimestamps);
  return { allowed: true, remaining: MAX_REQUESTS - activeTimestamps.length };
}

let ratelimitInstance = null;

/**
 * Checks if a client IP has exceeded the auth rate limit (5 requests per 15 minutes).
 * Uses Upstash Redis and @upstash/ratelimit if available, with a local Map fallback.
 * 
 * @param {string} ip - Client IP address
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
export async function checkAuthRateLimit(ip) {
  const redis = getRedis();

  if (!redis) {
    return checkMemoryLimit(ip);
  }

  try {
    if (!ratelimitInstance) {
      ratelimitInstance = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "15 m"),
        analytics: true,
        prefix: "@upstash/ratelimit/auth",
      });
    }

    const { success, remaining } = await ratelimitInstance.limit(ip);
    return { allowed: success, remaining };
  } catch (error) {
    console.warn(
      "[rate-limit] Upstash ratelimit failed, falling back to memory:",
      error.message || error
    );
    return checkMemoryLimit(ip);
  }
}
