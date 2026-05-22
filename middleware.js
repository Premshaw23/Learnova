import { NextResponse } from "next/server";

export function middleware(request) {
  const session = request.cookies.get("session");

  // Return to /auth if no session cookie exists
  if (!session) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/student/:path*",
    "/teacher/:path*",
    "/institute/:path*",
    "/admin/:path*",
    "/profile",
    "/settings"
  ],
};
