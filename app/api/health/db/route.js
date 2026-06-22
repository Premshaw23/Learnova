import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = await checkRateLimit(`health_db_${ip}`);

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

  try {
    const { client } = await connectDb();
    await client.db().command({ ping: 1 });

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });

  } catch (error) {
    return NextResponse.json({
      status: "degraded",
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }
}