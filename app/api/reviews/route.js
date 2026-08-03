import { z } from "zod";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { ValidationError, AppError } from "@/lib/errors";
import { getRedis } from "@/lib/redis";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 3600 * 1000; // 1 hour window
const MAX_REQUESTS_PER_WINDOW = 2;

// In-memory fallback rate limiter
const reviewFallbackMap = new Map();

async function checkReviewRateLimit(userId, ip) {
  const now = Date.now();
  const redis = getRedis();

  const keyUser = `rate_limit:reviews:user:${userId}`;
  const keyIp = `rate_limit:reviews:ip:${ip}`;

  const checkFallback = (uid, clientIp) => {
    const userTimestamps = reviewFallbackMap.get(uid) || [];
    const ipTimestamps = reviewFallbackMap.get(clientIp) || [];
    
    const activeUser = userTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    const activeIp = ipTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    
    if (activeUser.length >= MAX_REQUESTS_PER_WINDOW || activeIp.length >= MAX_REQUESTS_PER_WINDOW) {
      reviewFallbackMap.set(uid, activeUser);
      reviewFallbackMap.set(clientIp, activeIp);
      return false;
    }
    
    activeUser.push(now);
    activeIp.push(now);
    reviewFallbackMap.set(uid, activeUser);
    reviewFallbackMap.set(clientIp, activeIp);
    return true;
  };

  if (!redis) {
    return checkFallback(userId, ip);
  }

  try {
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const uniqueMemberId = `${now}_${Math.random().toString(36).substring(2, 8)}`;
    
    const pipeline = redis.pipeline();
    
    // Clean up and count for user
    pipeline.zremrangebyscore(keyUser, 0, windowStart);
    pipeline.zcard(keyUser);
    pipeline.zadd(keyUser, { score: now, member: uniqueMemberId });
    pipeline.pexpire(keyUser, RATE_LIMIT_WINDOW_MS);
    
    // Clean up and count for IP
    pipeline.zremrangebyscore(keyIp, 0, windowStart);
    pipeline.zcard(keyIp);
    pipeline.zadd(keyIp, { score: now, member: uniqueMemberId });
    pipeline.pexpire(keyIp, RATE_LIMIT_WINDOW_MS);
    
    const results = await pipeline.exec();
    
    const userCount = results[1];
    const ipCount = results[5];
    
    if (userCount >= MAX_REQUESTS_PER_WINDOW || ipCount >= MAX_REQUESTS_PER_WINDOW) {
      // Clean up both keys immediately since they were added in the pipeline
      const rollbackPipeline = redis.pipeline();
      rollbackPipeline.zrem(keyUser, uniqueMemberId);
      rollbackPipeline.zrem(keyIp, uniqueMemberId);
      await rollbackPipeline.exec();
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn("Redis reviews rate limiter failed, falling back:", err.message);
    return checkFallback(userId, ip);
  }
}

const reviewSchema = z.object({
  courseId: z.string().min(1, "Course ID is required").max(100),
  rating: z.number().min(1, "Minimum rating is 1").max(5, "Maximum rating is 5"),
  comment: z.string().min(1, "Review comment cannot be empty").max(1000, "Review comment too long"),
});

/**
 * GET /api/reviews?courseId=...
 * Fetches course reviews.
 */
export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    throw new ValidationError("Missing courseId parameter");
  }

  let reviews = [];
  try {
    if (process.env.MONGODB_URI) {
      const db = await connectDb();
      reviews = await db
        .collection("course_reviews")
        .find({ courseId })
        .sort({ createdAt: -1 })
        .toArray();
    }
  } catch (dbError) {
    console.warn("MongoDB fetch reviews failed, returning empty:", dbError.message);
  }

  return jsonSuccess({ reviews });
});

/**
 * POST /api/reviews
 * Submits a new course review under rate limiting.
 */
export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  const allowed = await checkReviewRateLimit(decodedToken.uid, ip);
  if (!allowed) {
    throw new AppError("Too many reviews. You can submit at most 2 reviews per hour.", 429);
  }

  const body = await parseJSON(request, 1024 * 10); // 10KB max
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid review payload");
  }

  const { courseId, rating, comment } = parsed.data;

  const reviewDoc = {
    courseId,
    userId: decodedToken.uid,
    userEmail: decodedToken.email || "anonymous@learnova.edu",
    rating,
    comment: comment.trim(),
    createdAt: new Date(),
  };

  let persisted = false;
  if (process.env.MONGODB_URI) {
    const db = await connectDb();
    await db.collection("course_reviews").insertOne(reviewDoc);
    persisted = true;
  }

  return jsonSuccess({
    persisted,
    review: reviewDoc,
    message: persisted
      ? "Review submitted successfully"
      : "Review cached successfully (Demo fallback mode active)",
  }, 201);
});
