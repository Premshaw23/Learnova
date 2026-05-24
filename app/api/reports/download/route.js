import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { ValidationError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("id");

  if (!reportId || !ObjectId.isValid(reportId)) {
    throw new ValidationError("Invalid or missing report ID");
  }

  const db = await connectDb();
  const report = await db.collection("reports").findOne({ _id: new ObjectId(reportId) });

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  // IDOR check: Verify if requesting user owns the report or is admin/teacher
  if (report.userId !== decodedToken.uid && decodedToken.role !== "admin" && decodedToken.role !== "teacher") {
    throw new ForbiddenError("Forbidden: You do not own this report");
  }

  return NextResponse.json({ success: true, data: report });
});
