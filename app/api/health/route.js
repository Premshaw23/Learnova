import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { initializeFirebase } from "@/lib/firebase-admin";
import { getRedis } from "@/lib/redis";
import { checkRateLimit } from "@/lib/rateLimit";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/health
 *
 * Returns a simple health status. Used by uptime monitors, load balancers,
 * and CI/CD pipelines. No sensitive infrastructure details are exposed.
 */
export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = await checkRateLimit(`health_${ip}`);

  if (!rateLimitResult.allowed) {
    return NextResponse.json({
      error: "Too Many Requests",
      message: "Rate limit exceeded for health checks.",
    }, {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  const checks = {};
  const startTime = Date.now();

  // 1. MongoDB health check
  try {
    const mongoStart = Date.now();
    const db = await connectDb();
    await db.command({ ping: 1 });
    checks.mongodb = { status: "healthy", latencyMs: Date.now() - mongoStart };
  } catch (error) {
    checks.mongodb = { status: "unhealthy" };
  }

  // 2. Firebase Admin SDK health check
  try {
    const fbStart = Date.now();
    initializeFirebase();
    admin.auth();
    checks.firebase = { status: "healthy", latencyMs: Date.now() - fbStart };
  } catch (error) {
    checks.firebase = { status: "unhealthy" };
  }

  // 3. Upstash Redis health check (optional)
  try {
    const redis = getRedis();
    if (redis) {
      const redisStart = Date.now();
      await redis.ping();
      checks.redis = { status: "healthy", latencyMs: Date.now() - redisStart };
    } else {
      checks.redis = { status: "not_configured" };
    }
  } catch (error) {
    checks.redis = { status: "unhealthy" };
  }

  // Determine overall status
  const statuses = Object.values(checks).map((c) => c.status);
  let overallStatus = "healthy";
  if (statuses.some((s) => s === "unhealthy")) {
    overallStatus = statuses.every((s) => s === "unhealthy")
      ? "unhealthy"
      : "degraded";
  }

  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
    },
    {
      status: httpStatus,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  );
}
