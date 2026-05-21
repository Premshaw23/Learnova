import { jsonError, jsonSuccess } from "@/lib/api-response";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { withSecurity } from "@/lib/security/middleware";
import { groqSchema } from "@/lib/security/validation-schemas";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    // Apply rate limiting and validation
    const securityResult = await withSecurity(request, {
      rateLimitType: 'strict',
      schema: groqSchema
    });
    if (securityResult instanceof Response) return securityResult;

    // Usage logging with user ID for audit/quota tracking
    console.log(`[nova-ai-quota-tracker] Paid Groq API request by User UID: ${decodedToken.uid} (${decodedToken.email}) at ${new Date().toISOString()}`);

    const { data: validatedData } = securityResult;
    const { message } = validatedData;
    const trimmedMessage = message?.trim();

    if (!trimmedMessage) {
      return jsonError("Message is required", 400);
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return jsonError("Message is too long", 400);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return jsonError("Groq API key is not configured", 500);
    }

    const timeoutMs = parseInt(process.env.GROQ_TIMEOUT || "30000", 10) || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are Nova, the friendly AI assistant for Learnova - a Smart Student Engagement Ecosystem. You help with questions about attendance automation, smart activities, security features, analytics, and educational technology. Always be helpful, informative, and encouraging. Keep responses concise but comprehensive.",
            },
            { role: "user", content: trimmedMessage },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return jsonError(
        errorBody?.error?.message || "Groq request failed",
        response.status,
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return jsonError("Groq response was empty", 502);
    }

    return jsonSuccess({ message: content });
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Groq API request timed out:", error);
      return jsonError("Gateway Timeout: Groq did not respond in time.", 504);
    }
    console.error("Groq API route error:", error);
    return jsonError("Internal server error", 500);
  }
}
