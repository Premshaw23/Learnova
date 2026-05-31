import { NextResponse } from "next/server";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth, requireRole } from "@/lib/rbac";
import { ValidationError, AppError } from "@/lib/errors";
import { initializeFirebase } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import admin from "firebase-admin";
import { z } from "zod";
import { hashPasscode } from "@/utils/passcodeUtils";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  passcode: z
    .string({ message: "Passcode must be a string" })
    .trim()
    .min(1, "Passcode is required"),
  expiresInMinutes: z
    .number({ message: "expiresInMinutes must be a number" })
    .int("expiresInMinutes must be an integer")
    .min(1, "Expiry must be at least 1 minute")
    .max(1440, "Expiry cannot exceed 24 hours"),
});

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);

  initializeFirebase();

  const { getUserProfile } = await import("@/lib/firebase-admin");
  const profile = await getUserProfile(decodedToken.uid);
  if (!profile) {
    return NextResponse.json(
      { error: "User profile not found" },
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
      { error: "Attendance settings not configured" },
      { status: 404 }
    );
  }

  const settings = settingsDoc.data();
  delete settings.passcode;

  return NextResponse.json(settings);
});

export const POST = withErrorHandler(async (request) => {
  const { profile } = await requireRole(request, ["teacher", "admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_settings_${ip}_${profile.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  initializeFirebase();

  const body = await parseJSON(request, 1024);

  const validation = postSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { passcode, expiresInMinutes } = validation.data;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

  const { getSettingsDocId } = await import("@/utils/passcodeUtils");
  const settingsDocId = getSettingsDocId(profile);

  const db = admin.firestore();
  await db
    .collection("attendance_settings")
    .doc(settingsDocId)
    .set(
      {
        passcode: hashPasscode(passcode),
        active: true,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        createdBy: profile.name || profile.email || "teacher",
      },
      { merge: true }
    );

  return NextResponse.json({
    success: true,
    expiresAt: expiresAt.toISOString(),
  });
});

export const DELETE = withErrorHandler(async (request) => {
  const { profile } = await requireRole(request, ["teacher", "admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`attendance_settings_delete_${ip}_${profile.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  initializeFirebase();

  const { getSettingsDocId } = await import("@/utils/passcodeUtils");
  const settingsDocId = getSettingsDocId(profile);

  const db = admin.firestore();
  await db
    .collection("attendance_settings")
    .doc(settingsDocId)
    .update({
      active: false,
      passcode: admin.firestore.FieldValue.delete(),
      closedAt: new Date().toISOString(),
    });

  return NextResponse.json({ success: true });
});
