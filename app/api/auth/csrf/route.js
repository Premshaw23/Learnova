import { NextResponse } from "next/server";
import { createCsrfCookie, generateCsrfToken } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
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
