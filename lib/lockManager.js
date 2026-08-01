import { getRedis } from "./redis";
import logger from "@/utils/logger";

/**
 * Lua script to safely release a lock only if we own it.
 */
const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/**
 * Lua script to safely extend a lock only if we still own it.
 */
const EXTEND_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("pexpire", KEYS[1], ARGV[2])
  else
    return 0
  end
`;

/**
 * Acquire a distributed lock.
 *
 * @param {string} resource
 * @param {number} ttl
 * @returns {Promise<string|null>}
 */
export async function acquireLock(resource, ttl = 5000) {
  const redis = getRedis();

  if (!redis) {
    // Local development fallback
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
    logger.error(`Failed to acquire lock for ${resource}`, {
      error: error.message,
    });

    return null;
  }
}

/**
 * Renew an existing lock.
 *
 * @param {string} resource
 * @param {string} value
 * @param {number} ttl
 * @returns {Promise<boolean>}
 */
export async function renewLock(resource, value, ttl = 5000) {
  const redis = getRedis();

  if (!redis || value === "local-bypass-lock") {
    return true;
  }

  try {
    const result = await redis.eval(
      EXTEND_LOCK_SCRIPT,
      [resource],
      [value, ttl]
    );

    return result === 1;
  } catch (error) {
    logger.error(`Failed to renew lock for ${resource}`, {
      error: error.message,
    });

    return false;
  }
}

/**
 * Release a distributed lock.
 *
 * @param {string} resource
 * @param {string} value
 * @returns {Promise<boolean>}
 */
export async function releaseLock(resource, value) {
  const redis = getRedis();

  if (!redis || value === "local-bypass-lock") {
    return true;
  }

  try {
    const result = await redis.eval(
      RELEASE_LOCK_SCRIPT,
      [resource],
      [value]
    );

    return result === 1;
  } catch (error) {
    logger.error(`Failed to release lock for ${resource}`, {
      error: error.message,
    });

    return false;
  }
}

/**
 * Execute a function with a distributed lock.
 * Automatically renews the lock while the critical section is running.
 *
 * @param {string} resource
 * @param {Function} fn
 * @param {number} retries
 * @param {number} baseDelay
 * @param {number} ttl
 */
export async function withLock(
  resource,
  fn,
  retries = 5,
  baseDelay = 100,
  ttl = 5000
) {
  let attempt = 0;

  while (attempt < retries) {
    const lockValue = await acquireLock(resource, ttl);

    if (lockValue) {
      let released = false;

      const renewalInterval = setInterval(async () => {
        try {
          if (!released) {
            const renewed = await renewLock(resource, lockValue, ttl);

            if (!renewed) {
              logger.warn(`Failed to renew lock for ${resource}`);
              clearInterval(renewalInterval);
            }
          }
        } catch (error) {
          logger.error(`Error renewing lock for ${resource}`, {
            error: error.message,
          });

          clearInterval(renewalInterval);
        }
      }, Math.floor(ttl / 2));

      try {
        return await fn();
      } finally {
        released = true;
        clearInterval(renewalInterval);
        await releaseLock(resource, lockValue);
      }
    }

    attempt++;

    const delay =
      baseDelay * Math.pow(2, attempt - 1) + Math.random() * 50;

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(
    `Failed to acquire distributed lock for ${resource} after ${retries} attempts`
  );
}