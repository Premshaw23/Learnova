import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { ForbiddenError } from "@/lib/errors";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";

export const GET = withErrorHandler(async (request) => {
  initFirebaseAdmin();
  const decodedToken = await authenticateRequest(request);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month");

  if (!userId || !month) {
    return NextResponse.json({ attendance: [] });
  }

  // 2. Ensure they are only querying attendance data for their own UID!
  if (decodedToken.uid !== userId) {
    throw new ForbiddenError("Forbidden: Cannot query attendance for another user");
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_heatmap_${ip}_${userId}`);
  if (!rateLimitResult.allowed) {
    return Response.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0, 23, 59, 59);

  const client = await clientPromise;
  const db = client.db();
  const records = await db
    .collection("attendance")
    .find({
      userId,
      date: { $gte: firstDay, $lte: lastDay },
    })
    .sort({ date: 1 })
    .toArray();

  const attendance = records.map((r) => ({
    date: new Date(r.date).toISOString().split("T")[0],
    status: r.status,
    subject: r.subject || "",
    markedAt: r.markedAt ? new Date(r.markedAt).toISOString() : null,
    _id: r._id.toString(),
  }));

  return NextResponse.json({ attendance });
});
