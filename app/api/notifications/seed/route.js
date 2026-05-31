import { connectDb } from "../../../../lib/mongodb";
import { parseJSON, authenticateRequest, withErrorHandler } from "../../../../lib/error-handler";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { AppError } from "../../../../lib/errors";
import { fail, success } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const body = await parseJSON(request, 1024);
  const { userId } = body;

  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  if (decodedToken.uid !== userId) {
    throw new AppError("Forbidden: You can only seed notifications for your own account", 403);
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`notifications_seed_${ip}_${userId}`);
  if (!rateLimitResult.allowed) {
    return fail(429, "TOO_MANY_REQUESTS", "Too many requests. Please slow down.");
  }

  const db = await connectDb();

  await db.collection("notifications").insertMany([
    {
      userId,
      message: "Attendance marked for CS101",
      type: "attendance",
      read: false,
      createdAt: new Date(),
    },
    {
      userId,
      message: "New notice posted by Admin",
      type: "notice",
      read: false,
      createdAt: new Date(),
    },
    {
      userId,
      message: "System alert: Maintenance scheduled",
      type: "alert",
      read: false,
      createdAt: new Date(),
    },
  ]);

  return success({ success: true });
});
