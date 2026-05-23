import { checkRateLimit } from "@/lib/rateLimit";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

    // 3 reset requests per minute per IP
    const rateKey = `pwd-reset:${ip}`;
    const limit = await checkRateLimit(rateKey);

    if (!limit.allowed) {
      return jsonError("Too many password reset requests. Please wait before trying again.", 429);
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      return jsonError("A valid email address is required", 400);
    }

    // Return success without revealing whether the email exists
    return jsonSuccess({ message: "If that address is registered, a reset email has been sent." }, 200);
  } catch (error) {
    console.error("Forgot-password route error:", error);
    return jsonError("Internal server error", 500);
  }
}
