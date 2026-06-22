import { NextResponse } from 'next/server';
import { connectDb, getDbMetrics } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/rbac';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Forbidden" },
      { status: error.statusCode || 403 }
    );
  }

  const startTime = performance.now();

  try {
    const { client } = await connectDb();
    await client.db().command({ ping: 1 });

    const latency = performance.now() - startTime;
    const metrics = getDbMetrics();

    return NextResponse.json({
      status: "healthy",
      message: "Database connection pool is operating normally.",
      latency: `${latency.toFixed(2)}ms`,
      poolStats: {
        state: metrics.activePool,
        totalRequestsServiced: metrics.totalRequests,
        transientFailuresRecovered: metrics.retries,
      },
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });

  } catch (error) {
    const latency = performance.now() - startTime;

    return NextResponse.json({
      status: "degraded",
      message: "Database connection pool failed to respond.",
      latency: `${latency.toFixed(2)}ms`,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }
}
