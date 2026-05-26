import clientPromise from "@/lib/mongodb";
import { parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

function serializeNotification(notification) {
  return {
    ...notification,
    _id: notification._id?.toString?.() || notification._id,
  };
}

export async function GET(request) {
  let decodedToken;
  try {
    decodedToken = await requireAuth(request);
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const notifications = await db
      .collection("notifications")
      .find({ userId: decodedToken.uid })
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
  let decodedToken;
  try {
    decodedToken = await requireAuth(request);
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    await db.collection("notifications").updateMany(
      { userId: decodedToken.uid, read: false },
      { $set: { read: true } }
    );

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false });
  }
}
