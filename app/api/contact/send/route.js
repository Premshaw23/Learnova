import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { withErrorHandler } from "@/lib/error-handler";

// Sanitize error messages to prevent credential leakage
function safeMongoError(err) {
  const msg = err?.message ?? String(err);
  // Redact MongoDB URI credentials
  return msg.replace(
    /mongodb(\+srv)?:\/\/[^@]+@/gi,
    "mongodb$1://[redacted]@"
  );
}

export const POST = withErrorHandler(async (request) => {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`contact_form_${ip}`);

  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please try again later.", 429);
  }

  const { name, email, company, message } = await request.json();

  // Validate required fields
  if (!name || !email || !message) {
    throw new AppError("Missing required fields", 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email address", 400);
  }

  // Validate message length
  if (message.trim().length < 10) {
    throw new AppError("Message must be at least 10 characters", 400);
  }

  if (message.trim().length > 1000) {
    throw new AppError("Message must not exceed 1000 characters", 400);
  }

  const contactReceiverEmail = process.env.CONTACT_RECEIVER_EMAIL;

  if (!contactReceiverEmail) {
    throw new AppError("Contact service not configured", 500);
  }

  // Send email via server-side SMTP
  // Using environment variables that are NOT exposed to client
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: contactReceiverEmail,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Institution/Company:</strong> ${company}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Sanitize error before logging to prevent credential leakage
    console.error("Contact form SMTP error:", safeMongoError(error));

    throw new AppError("Failed to send email", 500);
  }
});
