import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import {
  createNotification,
  createBulkNotifications,
  createAssignmentNotification,
  createAnnouncementNotification,
  createRoleBasedAnnouncement,
} from "@/services/notificationService";

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const authResult = await verifyFirebaseToken(token);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: "Invalid token", reason: authResult.reason },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, recipientId, title, message, metadata, actionUrl } = body;

    // Validate required fields
    if (!recipientId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: recipientId and message" },
        { status: 400 }
      );
    }

    const notificationId = await createNotification({
      recipientId,
      type: type || "info",
      title: title || "",
      message,
      metadata: metadata || {},
      actionUrl: actionUrl || null,
    });

    return NextResponse.json(
      { success: true, notificationId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/bulk
 * Create notifications for multiple recipients
 */
export async function bulkCreate(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const authResult = await verifyFirebaseToken(token);

    if (!authResult.valid) {
      return NextResponse.json(
        { error: "Invalid token", reason: authResult.reason },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipientIds, notificationData } = body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid recipientIds array" },
        { status: 400 }
      );
    }

    if (!notificationData || !notificationData.message) {
      return NextResponse.json(
        { error: "Missing notificationData.message" },
        { status: 400 }
      );
    }

    const notificationIds = await createBulkNotifications(
      recipientIds,
      notificationData
    );

    return NextResponse.json(
      { success: true, notificationIds },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return NextResponse.json(
      { error: "Failed to create bulk notifications" },
      { status: 500 }
    );
  }
}
