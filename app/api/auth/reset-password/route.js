import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    // Rate limit both by IP and by email to prevent spamming
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `reset_pwd_${sanitizedEmail}_${ip}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many password reset requests. Please try again later." },
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
      // Firebase throws "EMAIL_NOT_FOUND" when the user isn't registered
      const errorMessage = firebaseData.error?.message === "EMAIL_NOT_FOUND" 
        ? "No user found with this email address."
        : firebaseData.error?.message || "Failed to send reset email.";
        
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: firebaseRes.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
