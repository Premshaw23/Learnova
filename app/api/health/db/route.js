import { NextResponse } from 'next/server';
import { connectDb, getDbMetrics } from '@/lib/mongodb'; // Adjust path if your DB file is named differently

export async function GET() {
  const startTime = performance.now();
  
  try {
    // 1. Attempt to connect or retrieve the Singleton pool
    const { client } = await connectDb();
    
    // 2. Execute a raw ping to ensure the socket isn't stale
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
    }, { status: 200 });

  } catch (error) {
    const latency = performance.now() - startTime;
    
    return NextResponse.json({
      status: "degraded",
      message: "Database connection pool failed to respond.",
      latency: `${latency.toFixed(2)}ms`,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}