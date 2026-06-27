import { Redis } from "@upstash/redis";
import logger from "@/utils/logger";

let redisClient;

function getRedis() {
  if (
    !redisClient &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

const JOB_TTL_SECONDS = 7 * 24 * 60 * 60;

function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

const DEQUEUE_SCRIPT = `
  local members = redis.call("ZRANGE", KEYS[1], 0, 0, "WITHSCORES")
  if #members < 2 then return nil end
  local jobId = members[1]
  redis.call("ZREM", KEYS[1], jobId)
  redis.call("HSET", "queue:job:" .. jobId, "status", "processing", "updatedAt", ARGV[1])
  redis.call("SADD", KEYS[2], jobId)
  return jobId
`;

export async function enqueue(type, payload) {
  const redis = getRedis();
  if (!redis) {
    logger.error("[queue] Redis not available for enqueue");
    throw new Error("Queue unavailable: Redis not configured");
  }

  const jobId = generateJobId();
  const now = Date.now();

  const job = {
    id: jobId,
    type,
    payload: JSON.stringify(payload),
    status: "pending",
    retries: 0,
    maxRetries: 3,
    error: "",
    result: "",
    createdAt: now,
    updatedAt: now,
  };

  const pipe = redis.pipeline();
  pipe.hset(`queue:job:${jobId}`, job);
  pipe.zadd("queue:pending", { score: now, member: jobId });
  pipe.expire(`queue:job:${jobId}`, JOB_TTL_SECONDS);
  await pipe.exec();

  return jobId;
}

export async function getJob(jobId) {
  const redis = getRedis();
  if (!redis) return null;

  const data = await redis.hgetall(`queue:job:${jobId}`);
  if (!data || Object.keys(data).length === 0) return null;

  if (typeof data.payload === "string") {
    try {
      data.payload = JSON.parse(data.payload);
    } catch {
      data.payload = data.payload;
    }
  }
  if (typeof data.result === "string" && data.result) {
    try {
      data.result = JSON.parse(data.result);
    } catch {
      data.result = data.result;
    }
  }

  return data;
}

export async function claimNextJob() {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const jobId = await redis.eval(
      DEQUEUE_SCRIPT,
      ["queue:pending", "queue:active"],
      [String(Date.now())]
    );

    if (!jobId) return null;
    return getJob(jobId);
  } catch (error) {
    logger.error("[queue] Failed to claim next job", {
      error: error.message,
    });
    return null;
  }
}

export async function completeJob(jobId, result) {
  const redis = getRedis();
  if (!redis) return;

  const now = Date.now();
  const pipe = redis.pipeline();
  pipe.hset(`queue:job:${jobId}`, {
    status: "completed",
    result: JSON.stringify(result),
    updatedAt: now,
  });
  pipe.srem("queue:active", jobId);
  pipe.zadd("queue:completed", { score: now, member: jobId });
  await pipe.exec();
}

export async function failJob(jobId, errorMessage) {
  const redis = getRedis();
  if (!redis) return;

  const job = await getJob(jobId);
  const currentRetries = (job && Number(job.retries)) || 0;
  const maxRetries = (job && Number(job.maxRetries)) || 3;
  const nextRetry = currentRetries + 1;
  const now = Date.now();

  const pipe = redis.pipeline();

  if (nextRetry >= maxRetries) {
    pipe.hset(`queue:job:${jobId}`, {
      status: "failed",
      retries: nextRetry,
      error: errorMessage,
      updatedAt: now,
    });
    pipe.srem("queue:active", jobId);
    pipe.zadd("queue:failed", { score: now, member: jobId });
  } else {
    const backoffDelay = Math.pow(2, nextRetry) * 1000;
    pipe.hset(`queue:job:${jobId}`, {
      status: "pending",
      retries: nextRetry,
      error: errorMessage,
      updatedAt: now,
    });
    pipe.srem("queue:active", jobId);
    pipe.zadd("queue:pending", {
      score: now + backoffDelay,
      member: jobId,
    });
  }

  await pipe.exec();
}

export async function getQueueStats() {
  const redis = getRedis();
  if (!redis) {
    return { pending: 0, active: 0, completed: 0, failed: 0 };
  }

  try {
    const [pending, active, completed, failed] = await Promise.all([
      redis.zcard("queue:pending"),
      redis.scard("queue:active"),
      redis.zcard("queue:completed"),
      redis.zcard("queue:failed"),
    ]);

    return {
      pending: pending || 0,
      active: active || 0,
      completed: completed || 0,
      failed: failed || 0,
    };
  } catch (error) {
    logger.error("[queue] Failed to get queue stats", {
      error: error.message,
    });
    return { pending: 0, active: 0, completed: 0, failed: 0 };
  }
}

export const JOB_TYPES = {
  SEND_BULK_EMAILS: "send_bulk_emails",
  AWARD_GAMIFICATION_XP: "award_gamification_xp",
};
