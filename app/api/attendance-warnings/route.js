import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const instituteId = searchParams.get("instituteId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!instituteId) {
    return NextResponse.json({ error: "instituteId is required" }, { status: 400 });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export default GET;
