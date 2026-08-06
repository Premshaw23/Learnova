import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import {
  checkRateLimit,
  extractClientIp,
  RATE_LIMIT_IP_FALLBACK,
} from "@/lib/rateLimit";
import { exportUserData } from "@/services/exportService";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireAuth(request);
  const ip = extractClientIp(request) || RATE_LIMIT_IP_FALLBACK;
  const rateLimitResult = await checkRateLimit(
    `export_user_data_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const data = await exportUserData(decodedToken.uid);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    userId: decodedToken.uid,
    data,
  });
});
