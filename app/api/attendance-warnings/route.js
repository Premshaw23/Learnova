import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const instituteId = searchParams.get("instituteId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!instituteId) {
    return NextResponse.json(
      { error: "instituteId is required" },
      { status: 400 }
    );
  }

  if (startDate && endDate && startDate > endDate) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  return NextResponse.json({ warnings: [] });
}

export default GET;
