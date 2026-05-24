import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  await requireAuth(request);

  // Initialize Firebase app to prevent cold-start crashes
  initializeFirebase();

  const db = admin.firestore();
  const settingsDoc = await db
    .collection("attendance_settings")
    .doc("current_settings")
    .get();

  if (!settingsDoc.exists) {
    return NextResponse.json(
      { error: "Attendance settings not configured" },
      { status: 404 }
    );
  }

  const settings = settingsDoc.data();
  delete settings.passcode;

  return NextResponse.json(settings);
});
