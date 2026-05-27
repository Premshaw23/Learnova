import { success, fail } from "@/lib/apiResponse";
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
  const rateLimitResult = await checkRateLimit(`passcode_${ip}_${decodedToken?.uid}`);

  if (!rateLimitResult.allowed) {
    return fail(429, "RATE_LIMIT_EXCEEDED", "Too many attempts. Please try again later.", { valid: false });
  }

  // Initialize Firebase app to prevent cold-start crashes
  initializeFirebase();

  const body = await parseJSON(request, 1024);
  
  const validation = passcodeSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
    return fail(400, "BAD_REQUEST", firstError, { valid: false });
  }
  
  const { passcode } = validation.data;

  const db = admin.firestore();
  const settingsDoc = await db
    .collection("attendance_settings")
    .doc("current_settings")
    .get();

  if (!settingsDoc.exists) {
    return fail(404, "NOT_FOUND", "Attendance settings not configured", { valid: false });
  }

  const settings = settingsDoc.data();

  if (!settings.active) {
    return fail(403, "FORBIDDEN", "Attendance window is currently closed.", { valid: false });
  }

  if (settings.expiresAt && new Date(settings.expiresAt) < new Date()) {
    return fail(410, "GONE", "Attendance passcode has expired.", { valid: false });
  }

  if (verifyPasscode(passcode, settings.passcode)) {
    return success({ valid: true });
  }

  return fail(401, "UNAUTHORIZED", "Invalid passcode. Please contact your teacher for the correct code.", { valid: false });
});
