import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { ForbiddenError, ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  // 1. Environment check: Block seeding in production
  if (process.env.NODE_ENV === "production") {
    throw new ForbiddenError("Not allowed in production");
  }

  // 2. Authentication check: Only admin is allowed to seed
  await requireRole(request, ["admin"]);

  // 3. Body parsing and validation
  let body;
  try {
    body = await request.json();
  } catch (err) {
    throw new ValidationError("Invalid JSON payload");
  }

  const { userId } = body;
  if (!userId) {
    throw new ValidationError("userId is required");
  }

  // 4. Rate limiting check
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-proxied-for") ||
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  const rateLimitResult = await checkRateLimit(`notifications_seed_${ip}_${userId}`);
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
