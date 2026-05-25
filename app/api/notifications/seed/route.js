import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { userId } = body;

  if (!userId) {
    return Response.json({ success: false, message: "userId is required" }, { status: 400 });
  }

  try {
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
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}