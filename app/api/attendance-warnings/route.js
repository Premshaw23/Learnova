import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
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
