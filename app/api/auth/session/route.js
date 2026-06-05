import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { createSession, terminateSession } from "@/lib/sessionManager";

export const dynamic = "force-dynamic";

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  };
}

export const POST = withErrorHandler(async (request) => {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`session_${ip}`);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const decodedToken = await requireAuth(request);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const authToken =
    bearerToken || request.cookies.get("authToken")?.value || null;

  if (!authToken) {
    return NextResponse.json(
      { success: false, error: "Missing authentication token" },
      { status: 400 }
    );
  }

  // Create stateful session in Redis
  const fingerprint = request.headers.get("user-agent") || "unknown";
  const sessionId = await createSession(decodedToken.uid, { ip, fingerprint });

  const response = NextResponse.json({
    success: true,
    uid: decodedToken.uid,
  });

  response.cookies.set("authToken", authToken, getAuthCookieOptions());
  response.cookies.set("sessionId", sessionId, getAuthCookieOptions());

  return response;
});

export const DELETE = withErrorHandler(async (request) => {
  await requireAuth(request);

  const sessionId = request.cookies.get("sessionId")?.value;
  if (sessionId) {
    await terminateSession(sessionId);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("authToken", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("sessionId", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
});
