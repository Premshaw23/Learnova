import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { parseJSON } from "@/lib/error-handler";

const MAX_RESET_PASSWORD_PAYLOAD_BYTES = 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const { email } = await parseJSON(
      request,
      MAX_RESET_PASSWORD_PAYLOAD_BYTES
    );

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Rate limit both by IP and by email to prevent spamming
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `reset_pwd_${sanitizedEmail}_${ip}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many password reset requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Call the identitytoolkit REST API to send the reset email directly from the backend
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Server misconfiguration: missing API key." },
        { status: 500 }
      );
    }

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email: sanitizedEmail,
        }),
      }
    );

    const firebaseData = await firebaseRes.json();

    if (!firebaseRes.ok) {
      if (firebaseData.error?.message === "EMAIL_NOT_FOUND") {
        // Prevent user enumeration: pretend it succeeded
        return NextResponse.json({
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent.",
        });
      }

      // Log the actual error internally for debugging, but do NOT expose it to the client
      console.warn(
        "Password reset upstream error:",
        firebaseData.error?.message
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to send reset email due to a server error. Please try again later.",
        },
        { status: 500 }
      );
    }

    // Always return a generic success message
    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Password reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
