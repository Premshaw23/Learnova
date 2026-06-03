import { NextResponse } from "next/server";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { ValidationError } from "@/lib/errors";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { verifyPasscode } from "@/utils/passcodeUtils";

export const dynamic = "force-dynamic";

const passcodeSchema = z.object({
  passcode: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Passcode is required"
          : "Passcode must be a string",
    })
    .trim()
    .min(1, "Passcode is required"),
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `passcode_${ip}_${decodedToken?.uid}`
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { valid: false, error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  // Initialize Firebase app to prevent cold-start crashes
  initializeFirebase();

  const body = await parseJSON(request, 1024);

  const validation = passcodeSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    return NextResponse.json(
      { valid: false, error: firstError },
      { status: 400 }
    );
  }

  const { passcode } = validation.data;

  const { getUserProfile } = await import("@/lib/firebase-admin");
  const profile = await getUserProfile(decodedToken.uid);
  if (!profile) {
    return NextResponse.json(
      { valid: false, error: "User profile not found." },
      { status: 404 }
    );
  }

  const { getSettingsDocId } = await import("@/utils/passcodeUtils");
  const settingsDocId = getSettingsDocId(profile);

  const db = admin.firestore();
  let settingsDoc = await db
    .collection("attendance_settings")
    .doc(settingsDocId)
    .get();

  if (!settingsDoc.exists) {
    // Fallback for existing data
    settingsDoc = await db
      .collection("attendance_settings")
      .doc("current_settings")
      .get();
  }

  if (!settingsDoc.exists) {
    return NextResponse.json(
      { valid: false, error: "Attendance settings not configured" },
      { status: 404 }
    );
  }

  const settings = settingsDoc.data();

  if (!settings.active) {
    return NextResponse.json(
      { valid: false, error: "Attendance window is currently closed." },
      { status: 403 }
    );
  }

  if (settings.expiresAt && new Date(settings.expiresAt) < new Date()) {
    return NextResponse.json(
      { valid: false, error: "Attendance passcode has expired." },
      { status: 410 }
    );
  }

  if (verifyPasscode(passcode, settings.passcode)) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json(
    {
      valid: false,
      error:
        "Invalid passcode. Please contact your teacher for the correct code.",
    },
    { status: 401 }
  );
});
