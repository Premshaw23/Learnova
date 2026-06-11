import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { getUserProfile } from "@/lib/firebase-admin";
import { exportAttendance, formatCSV } from "@/services/exportService";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, [
    "admin",
    "institute",
    "teacher",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `export_attendance_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");
  const format = searchParams.get("format") || "json";

  const profile = await getUserProfile(decodedToken.uid);
  const instituteId = profile?.instituteId || decodedToken.instituteId;
  if (!instituteId && decodedToken.role !== "admin") {
    throw new AppError("Institute ID not found", 400);
  }

  const records = await exportAttendance({
    instituteId: instituteId || "global",
    classId,
    startDate,
    endDate,
    status,
  });

  if (format === "csv") {
    const csv = formatCSV(records);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    count: records.length,
    records,
  });
});
