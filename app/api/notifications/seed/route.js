import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { ForbiddenError, ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  // 1. Environment check: Block seeding in production
  if (process.env.NODE_ENV === "production") {
    throw new ForbiddenError("Not allowed in production");
  }

  // 2. Authentication check
  const decodedToken = await requireAuth(request);

  // 3. Body parsing and validation
  const body = await parseJSON(request, 1024 * 10);

  const { userId } = body;
  if (!userId) {
    throw new ValidationError("userId is required");
  }

  // Allow admins to seed any user, but non-admins can only seed notifications for their own account
  const isAdmin = decodedToken.role === "admin";
  if (!isAdmin && decodedToken.uid !== userId) {
    throw new ForbiddenError(
      "Forbidden: You can only seed notifications for your own account"
    );
  }

  // 4. Rate limiting check
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-proxied-for") ||
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  const rateLimitResult = await checkRateLimit(
    `notifications_seed_${ip}_${userId}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  // 5. Database operations: Insert mock notifications
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

  return NextResponse.json({ success: true });
});
