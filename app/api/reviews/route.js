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

  const checkFallback = (id) => {
    if (!reviewFallbackMap.has(id)) {
      reviewFallbackMap.set(id, [now]);
      return true;
    }
    const timestamps = reviewFallbackMap.get(id);
    const active = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (active.length >= MAX_REQUESTS_PER_WINDOW) {
      reviewFallbackMap.set(id, active);
      return false;
    }
    active.push(now);
    reviewFallbackMap.set(id, active);
    return true;
  };

  if (!redis) {
    const userOk = checkFallback(userId);
    const ipOk = checkFallback(ip);
    return userOk && ipOk;
  }

  try {
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    
    // Check user limit
    const pUser = redis.pipeline();
    pUser.zremrangebyscore(keyUser, 0, windowStart);
    pUser.zcard(keyUser);
    const resUser = await pUser.exec();
    const userCount = resUser[1];

    // Check IP limit
    const pIp = redis.pipeline();
    pIp.zremrangebyscore(keyIp, 0, windowStart);
    pIp.zcard(keyIp);
    const resIp = await pIp.exec();
    const ipCount = resIp[1];

    if (userCount >= MAX_REQUESTS_PER_WINDOW || ipCount >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    const uniqueMemberId = `${now}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Increment user key
    const pUserAdd = redis.pipeline();
    pUserAdd.zadd(keyUser, { score: now, member: uniqueMemberId });
    pUserAdd.pexpire(keyUser, RATE_LIMIT_WINDOW_MS);
    await pUserAdd.exec();

    // Increment IP key
    const pIpAdd = redis.pipeline();
    pIpAdd.zadd(keyIp, { score: now, member: uniqueMemberId });
    pIpAdd.pexpire(keyIp, RATE_LIMIT_WINDOW_MS);
    await pIpAdd.exec();

    return true;
  } catch (err) {
    console.warn("Redis reviews rate limiter failed, falling back:", err.message);
    const userOk = checkFallback(userId);
    const ipOk = checkFallback(ip);
    return userOk && ipOk;
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
