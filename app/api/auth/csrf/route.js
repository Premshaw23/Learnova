import { NextResponse } from "next/server";
import { createCsrfCookie, generateCsrfToken } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`csrf_${ip}`);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const csrfToken = generateCsrfToken();
  const response = NextResponse.json(
    {
      success: true,
      csrfToken,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );

  const csrfCookie = createCsrfCookie(csrfToken);
  response.cookies.set(csrfCookie.name, csrfCookie.value, csrfCookie.options);

  return response;
}
