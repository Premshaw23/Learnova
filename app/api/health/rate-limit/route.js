import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { getRedis } from "@/lib/redis";
import logger from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = {
    mongodb: "unknown",
    redis: "unknown",
    fallback: "in_memory",
    overall: "degraded",
  };

  // 1. Check MongoDB
  try {
    const db = await connectDb();
    if (db) {
      await db.command({ ping: 1 });
      status.mongodb = "connected";
    } else {
      status.mongodb = "unavailable";
    }
  } catch (error) {
    status.mongodb = "error";
  }

  // 2. Check Upstash Redis
  try {
    const redis = getRedis();
    if (redis) {
      const ping = await redis.ping();
      status.redis = ping === "PONG" ? "connected" : "error";
    } else {
      status.redis = "unconfigured";
    }
  } catch (error) {
    status.redis = "error";
  }

  // 3. Determine Overall Status
  if (status.mongodb === "connected") {
    status.overall = "healthy";
  } else if (status.redis === "connected") {
    status.overall = "healthy_fallback";
  } else {
    status.overall = "degraded_in_memory";
    logger.warn("Rate-limit health check failed: both backends unavailable");
  }

  return NextResponse.json(
    { status },
    { status: status.overall.includes("degraded") ? 503 : 200 }
  );
}
