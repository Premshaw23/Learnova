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
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Email is required",
          },
        },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(sanitizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Please enter a valid email address.",
          },
        },
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
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many password reset requests. Please try again later.",
          },
        },
        { status: 429 }
      );
    }

    // Call the identitytoolkit REST API to send the reset email directly from the backend
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Server misconfiguration: missing API key.",
          },
        },
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
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send reset email due to a server error. Please try again later.",
          },
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
      let code = "BAD_REQUEST";
      if (error.statusCode === 401) code = "UNAUTHORIZED";
      else if (error.statusCode === 403) code = "FORBIDDEN";
      else if (error.statusCode === 404) code = "NOT_FOUND";
      else if (error.statusCode === 429) code = "TOO_MANY_REQUESTS";
      else if (error.statusCode >= 500) code = "INTERNAL_SERVER_ERROR";

      return NextResponse.json(
        {
          success: false,
          error: {
            code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    console.error("Password reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
