import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";

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
  const decodedToken = await requireAuth(request);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
  const authToken = bearerToken || request.cookies.get("authToken")?.value || null;

  if (!authToken) {
    return NextResponse.json({ success: false, error: "Missing authentication token" }, { status: 400 });
  }

  const response = NextResponse.json({
    success: true,
    uid: decodedToken.uid,
  });

  response.cookies.set("authToken", authToken, getAuthCookieOptions());

  return response;
});

export const DELETE = withErrorHandler(async (request) => {
  await requireAuth(request);

  const response = NextResponse.json({ success: true });
  response.cookies.set("authToken", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
});
