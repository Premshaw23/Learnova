import { connectDb } from "@/lib/mongodb";
import { parseJSON, authenticateRequest, withErrorHandler } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";

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

  return Response.json({ success: true });
});