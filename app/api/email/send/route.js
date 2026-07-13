import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendBulkAnnouncement } from "@/services/emailService";
import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, [
    "admin",
    "institute",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `email_send_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const { subject, body, recipientRole, targetIds } = await request.json();

  if (!subject || !body) {
    throw new AppError("Subject and body are required", 400);
  }

  const db = await connectDb();
  const query = {};

  if (targetIds && Array.isArray(targetIds)) {
    query.uid = { $in: targetIds };
  } else if (recipientRole) {
    query.role = recipientRole;
  }

  if (decodedToken.role !== "admin") {
    query.instituteId = decodedToken.instituteId || decodedToken.uid;
  }

  const recipients = await db.collection("users").find(query).toArray();

  if (recipients.length === 0) {
    throw new AppError("No recipients found matching the criteria", 404);
  }

  const senderName =
    decodedToken.name || decodedToken.fullName || decodedToken.email;
  const dashboardUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://learnova.app";
  const instituteName =
    decodedToken.instituteName || decodedToken.instituteId || "Learnova";

  let sentCount = 0;
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    const prefs = recipient.emailPreferences || {};
    if (prefs.bulkAnnouncements === false) continue;

    sendBulkAnnouncement({
      email: recipient.email,
      name: recipient.name || recipient.fullName || "User",
      subject,
      body,
      senderName,
      instituteName,
      dashboardUrl,
    });
    sentCount++;
  }

  return NextResponse.json({
    success: true,
    recipientsFound: recipients.length,
    emailsQueued: sentCount,
  });
});
