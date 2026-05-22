import { jsonError, jsonSuccess } from "@/lib/api-response";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { detectInjection, sanitizeMessage, buildSecureMessages } from "@/utils/promptGuard";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Handles incoming chat completions requests using the Groq AI SDK.
 * Secured via Firebase Bearer Token authentication to prevent API resource abuse,
 * billing spikes, and unauthorized client consumption. Includes per-user rate limiting.
 * 
 * @param {Request} request - The incoming HTTP POST request.
 * @returns {Promise<Response>} JSON response containing completion results or an error payload.
 */
export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    // Rate limiting per authenticated user (persisted across cold starts)
    const rateLimit = await checkRateLimit(decodedToken.uid);
    if (!rateLimit.allowed) {
      return jsonError("Too many requests. Please try again later.", 429);
    }

    // Usage logging with user ID for audit/quota tracking
    console.log(`[nova-ai-quota-tracker] Paid Groq API request by User UID: ${decodedToken.uid} (${decodedToken.email}) at ${new Date().toISOString()}`);

    const { message, userMessage } = await request.json();
    const rawMessage = typeof message === "string" ? message : userMessage;
    const trimmedMessage = rawMessage?.trim();

    if (!trimmedMessage) {
      return jsonError("Message is required", 400);
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return jsonError("Message is too long", 400);
    }

    const { isInjection, matchedPattern } = detectInjection(trimmedMessage);
    if (isInjection) {
      console.warn(`[nova-prompt-guard] Injection attempt detected from UID: ${decodedToken.uid}, pattern: ${matchedPattern}`);
      return jsonError("Your message contains content that violates usage policies. Please rephrase your question.", 400);
    }

    const cleanMessage = sanitizeMessage(trimmedMessage);
    if (!cleanMessage) {
      return jsonError("Message is required", 400);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return jsonError("Groq API key is not configured", 500);
    }

    const timeoutMs = parseInt(process.env.GROQ_TIMEOUT || "30000", 10) || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const messages = buildSecureMessages(cleanMessage, SYSTEM_PROMPT);

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
          messages,
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
