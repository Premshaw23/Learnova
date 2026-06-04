import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/health
 * 
 * Returns the health status of all critical backend dependencies.
 * Used by uptime monitors, load balancers, and CI/CD pipelines.
 * 
 * Response format:
 * {
 *   status: "healthy" | "degraded" | "unhealthy",
 *   timestamp: ISO string,
 *   uptime: seconds,
 *   checks: {
 *     mongodb: { status, latencyMs },
 *     firebase: { status, latencyMs },
 *     redis: { status, latencyMs }
 *   }
 * }
 */
export async function GET() {
  const checks = {};
  const startTime = Date.now();

  // 1. MongoDB health check
  try {
    const mongoStart = Date.now();
    const db = await connectDb();
    await db.command({ ping: 1 });
    checks.mongodb = { status: "healthy", latencyMs: Date.now() - mongoStart };
  } catch (error) {
    checks.mongodb = { status: "unhealthy", error: error.message };
  }

  // 2. Firebase Admin SDK health check
  try {
    const fbStart = Date.now();
    initializeFirebase();
    // Verify Firebase Admin is initialized by getting auth instance
    admin.auth(); 
    checks.firebase = { status: "healthy", latencyMs: Date.now() - fbStart };
  } catch (error) {
    checks.firebase = { status: "unhealthy", error: error.message };
  }

  // 3. Upstash Redis health check (optional)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const redisStart = Date.now();
      await redis.ping();
      checks.redis = { status: "healthy", latencyMs: Date.now() - redisStart };
    } catch (error) {
      checks.redis = { status: "unhealthy", error: error.message };
    }
  } else {
    checks.redis = { status: "not_configured" };
  }

  // Determine overall status
  const statuses = Object.values(checks).map((c) => c.status);
  let overallStatus = "healthy";
  if (statuses.some((s) => s === "unhealthy")) {
    overallStatus = statuses.every((s) => s === "unhealthy") ? "unhealthy" : "degraded";
  }

  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      version: process.env.npm_package_version || "1.0.0",
      checks,
    },
    { status: httpStatus }
  );
}
