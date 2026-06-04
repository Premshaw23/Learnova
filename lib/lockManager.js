import { Redis } from "@upstash/redis";
import logger from "@/utils/logger";

let redisClient;

export function getRedis() {
  if (!redisClient && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

/**
 * Acquire a distributed lock.
 * @param {string} resource - The unique identifier for the lock (e.g., "lock:xp_award:user_id").
 * @param {number} ttl - Time to live in milliseconds.
 * @returns {Promise<string|null>} Returns the lock value (uuid) if successful, or null if failed.
 */
export async function acquireLock(resource, ttl = 5000) {
  const redis = getRedis();
  if (!redis) {
    // If no redis is configured, bypass locking (for local dev environments)
    return "local-bypass-lock";
  }

  const value = `${Date.now()}-${Math.random()}`;
  try {
    const result = await redis.set(resource, value, {
      nx: true,
      px: ttl,
    });
    return result === "OK" ? value : null;
  } catch (error) {
    logger.error(`Failed to acquire lock for ${resource}`, { error: error.message });
    return null;
  }
}

/**
 * Release a distributed lock.
 * @param {string} resource - The unique identifier for the lock.
 * @param {string} value - The lock value returned by acquireLock.
 * @returns {Promise<boolean>} True if released, false otherwise.
 */
export async function releaseLock(resource, value) {
  const redis = getRedis();
  if (!redis || value === "local-bypass-lock") {
    return true;
  }

  try {
    // Lua script to ensure we only delete the lock if we own it
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await redis.eval(script, [resource], [value]);
    return result === 1;
  } catch (error) {
    logger.error(`Failed to release lock for ${resource}`, { error: error.message });
    return false;
  }
}

/**
 * Execute a function with a lock, automatically handling acquisition and release with retries.
 * @param {string} resource - The lock key.
 * @param {Function} fn - The async function to execute.
 * @param {number} retries - Number of retry attempts.
 * @param {number} baseDelay - Base delay in ms between retries.
 */
export async function withLock(resource, fn, retries = 5, baseDelay = 100) {
  let attempt = 0;
  while (attempt < retries) {
    const lockValue = await acquireLock(resource);
    if (lockValue) {
      try {
        return await fn();
      } finally {
        await releaseLock(resource, lockValue);
      }
    }
    attempt++;
    const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 50;
    await new Promise((res) => setTimeout(res, delay));
  }
  throw new Error(`Failed to acquire distributed lock for ${resource} after ${retries} attempts`);
}
