import { NextResponse } from "next/server";
import { createNotification } from "@/services/notificationService";

/**
 * POST /api/notifications/test
 * Test endpoint to create a sample notification
 * This is for testing purposes only - remove in production
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { recipientId, message } = body;

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: "Missing recipientId or message" },
        { status: 400 }
      );
    }

    const notificationId = await createNotification({
      recipientId,
      type: "info",
      title: "Test Notification",
      message,
      metadata: { test: true },
    });

    return NextResponse.json(
      { success: true, notificationId, message: "Test notification created" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating test notification:", error);
    return NextResponse.json(
      { error: error.message, details: "Failed to create test notification" },
      { status: 500 }
    );
  }
}
