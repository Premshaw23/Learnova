import { connectDb } from "./mongodb";
import { Redis } from "@upstash/redis";

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

export async function checkRateLimit(userId) {
  try {
    const db = await connectDb();
    if (!db || typeof db.collection !== "function") {
      console.error("[rate-limit] MongoDB unavailable — rate limiting disabled");
      throw new Error("MongoDB unavailable");
    }
    const collection = db.collection("rate_limits");

    await ensureIndexes(collection);

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    const result = await collection.findOneAndUpdate(
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
        $setOnInsert: { userId },
      },
      { upsert: true, returnDocument: "after" }
    );

    const recentRequests = (result?.requests ?? []).filter(
      (t) => new Date(t) >= windowStart
    );

    if (recentRequests.length > MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - recentRequests.length,
    };
  } catch (err) {
    const hasRedis =
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!hasRedis) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(
        "[rate-limit] MongoDB failed and no Upstash Redis configured — granting pass:",
        errMsg
      );
      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }

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
      console.error(
        "[rate-limit] Both MongoDB and Upstash Redis failed — granting pass:",
        redisErr
      );
      return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }
  }
}
