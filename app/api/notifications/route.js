import clientPromise from "../../../lib/mongodb";
import { parseJSON, withErrorHandler } from "../../../lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "../../../lib/rateLimit";
import { AppError } from "../../../lib/errors";
import { fail, success } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

function serializeNotification(notification) {
  return {
    ...notification,
    _id: notification._id?.toString?.() || notification._id,
  };
}

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return success({ notifications: [] });
  }

  if (decodedToken.uid !== userId) {
    throw new AppError(
      "Forbidden: You can only access your own notifications",
      403
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `notifications_get_${ip}_${userId}`
  );
  if (!rateLimitResult.allowed) {
    return fail(
      429,
      "TOO_MANY_REQUESTS",
      "Too many requests. Please slow down."
    );
  }

  const client = await clientPromise;
  const db = client.db();
  const notifications = await db
    .collection("notifications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  return success({
    notifications: notifications.map(serializeNotification),
  });
});

export const PATCH = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const body = await parseJSON(request, 1024);
  const { userId } = body;

  if (!userId) {
    return fail(400, "BAD_REQUEST", "userId is required");
  }

  if (decodedToken.uid !== userId) {
    throw new AppError(
      "Forbidden: You can only modify your own notifications",
      403
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `notifications_patch_${ip}_${userId}`
  );
  if (!rateLimitResult.allowed) {
    return fail(
      429,
      "TOO_MANY_REQUESTS",
      "Too many requests. Please slow down."
    );
  }

  const client = await clientPromise;
  const db = client.db();

  await db
    .collection("notifications")
    .updateMany({ userId, read: false }, { $set: { read: true } });

  return success({ success: true });
});
