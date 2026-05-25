import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

function serializeNotification(notification) {
  return {
    ...notification,
    _id: notification._id?.toString?.() || notification._id,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json({ notifications: [] });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const notifications = await db
      .collection("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return Response.json({
      notifications: notifications.map(serializeNotification),
    });
  } catch {
    return Response.json({ notifications: [] });
  }
}

export async function PATCH(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { userId } = body;

  if (!userId) {
    return Response.json({ success: false });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    await db.collection("notifications").updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false });
  }
}