import { NextResponse } from "next/server";
import { connectDb, getDbMetrics, isDbHealthy } from "@/lib/mongodb";

export async function GET() {
  const startTime = performance.now();

  try {
    // Quick health check via ping
    const healthy = await isDbHealthy();
    if (!healthy) {
      throw new Error("Ping failed");
    }

    // Get the db instance to run a ping command
    const db = await connectDb();
    await db.command({ ping: 1 });

    const latency = performance.now() - startTime;
    const metrics = getDbMetrics();

    return NextResponse.json(
      {
        status: "healthy",
        message: "Database connection pool is operating normally.",
        latency: `${latency.toFixed(2)}ms`,
        poolStats: {
          state: metrics.activePool,
          mainPool: metrics.mainPool,
          ssePool: metrics.ssePool,
          totalRequestsServiced: metrics.totalRequests,
          transientFailuresRecovered: metrics.retries,
          connectionErrors: metrics.connectionErrors,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const latency = performance.now() - startTime;
    const metrics = getDbMetrics();

    return NextResponse.json(
      {
        status: "degraded",
        message: "Database connection pool failed to respond.",
        latency: `${latency.toFixed(2)}ms`,
        poolStats: {
          connectionErrors: metrics.connectionErrors,
        },
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
