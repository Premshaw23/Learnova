import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { requireRole } from "@/lib/rbac";
import { ValidationError } from "@/lib/errors";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  await requireAuth(request);

  const { passcode } = await request.json();

  if (!passcode) {
    return NextResponse.json(
      { valid: false, error: "Passcode is required" },
      { status: 400 }
    );
  }

  const db = admin.firestore();
  const settingsDoc = await db
    .collection("attendance_settings")
    .doc("current_settings")
    .get();

  if (!settingsDoc.exists) {
    return NextResponse.json(
      { valid: false, error: "Attendance settings not configured" },
      { status: 404 }
    );
  }

  const settings = settingsDoc.data();

  if (settings.passcode === passcode) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({
    valid: false,
    error: "Invalid passcode. Please contact your teacher for the correct code.",
  });
});
