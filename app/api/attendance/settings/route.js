import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth, requireRole } from "@/lib/rbac";
import { ValidationError } from "@/lib/errors";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { z } from "zod";

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
  await requireAuth(request);

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

export const POST = withErrorHandler(async (request) => {
  const { profile } = await requireRole(request, ["teacher", "admin"]);

  initializeFirebase();

  const body = await request.json();

  const validation = postSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { passcode, expiresInMinutes } = validation.data;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

  const db = admin.firestore();
  await db
    .collection("attendance_settings")
    .doc("current_settings")
    .set(
      {
        passcode,
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
  await requireRole(request, ["teacher", "admin"]);

  initializeFirebase();

  const db = admin.firestore();
  await db
    .collection("attendance_settings")
    .doc("current_settings")
    .update({
      active: false,
      passcode: admin.firestore.FieldValue.delete(),
      closedAt: new Date().toISOString(),
    });

  return NextResponse.json({ success: true });
});
