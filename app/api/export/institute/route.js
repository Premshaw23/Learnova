import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { getUserProfile } from "@/lib/firebase-admin";
import { exportInstituteData } from "@/services/exportService";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, [
    "admin",
    "institute",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `export_institute_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const { searchParams } = new URL(request.url);
  const profile = await getUserProfile(decodedToken.uid);
  const targetInstituteId =
    searchParams.get("instituteId") ||
    (decodedToken.role === "admin" ? null : (profile?.instituteId || decodedToken.instituteId));

  if (!targetInstituteId) {
    throw new AppError("Institute ID is required for admin export", 400);
  }

  const data = await exportInstituteData(targetInstituteId);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    instituteId: targetInstituteId,
    data,
  });
});
