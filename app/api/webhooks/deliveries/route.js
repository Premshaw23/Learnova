import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { getDeliveryLogs } from "@/db/webhookStore";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const decodedToken = await requireAdmin(request);
    if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);

    const logs = await getDeliveryLogs(limit, skip);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
