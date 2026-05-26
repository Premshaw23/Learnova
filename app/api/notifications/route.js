import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { parseJSON, authenticateRequest, withErrorHandler } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

function serializeNotification(notification) {
  return {
    ...notification,
    _id: notification._id?.toString?.() || notification._id,
  };
}

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ notifications: [] });
  }

  if (decodedToken.uid !== userId) {
    throw new AppError("Forbidden: You can only access your own notifications", 403);
  }

  const client = await clientPromise;
  const db = client.db();
  const notifications = await db
    .collection("notifications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  return NextResponse.json({
    notifications: notifications.map(serializeNotification),
  });
});

export const PATCH = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const body = await parseJSON(request, 1024);
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ success: false });
  }

  if (decodedToken.uid !== userId) {
    throw new AppError("Forbidden: You can only modify your own notifications", 403);
  }

  const client = await clientPromise;
  const db = client.db();

  await db.collection("notifications").updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({ success: true });
});