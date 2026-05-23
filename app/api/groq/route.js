import { jsonSuccess, jsonError } from "@/lib/api-response";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

const rateLimitMap = new Map();

/**
 * Simple in-memory rate limiter
 */
const isRateLimited = (userId) => {
  const now = Date.now();

  const userRequests =
    rateLimitMap.get(userId) || [];

  const validRequests = userRequests.filter(
    (timestamp) =>
      now - timestamp < RATE_LIMIT_WINDOW
  );

  if (
    validRequests.length >=
    MAX_REQUESTS_PER_WINDOW
  ) {
    return true;
  }

  validRequests.push(now);

  rateLimitMap.set(userId, validRequests);

  return false;
};

export async function POST(request) {
  try {
    // Authentication
    const authorization =
      request.headers.get("authorization");

    const token =
      authorization?.split(" ")[1];

    const decodedToken =
      await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    // Rate limiting
    if (isRateLimited(decodedToken.uid)) {
      return jsonError(
        "Too many requests. Please try again later.",
        429
      );
    }

    // Parse body
    const body = await request.json();

    const rawMessage =
      typeof body.message === "string"
        ? body.message
        : body.userMessage;

    const trimmedMessage =
      rawMessage?.trim();

    if (!trimmedMessage) {
      return jsonError(
        "Message is required",
        400
      );
    }

    // Validate length
    if (trimmedMessage.length > 2000) {
      return jsonError(
        "Message too long",
        400
      );
    }

    // API key
    const apiKey =
      process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new AppError(
        "Groq API key is not configured",
        500
      );
    }

    // Timeout setup
    const timeoutMs = parseInt(
      process.env.GROQ_TIMEOUT || "30000",
      10
    );

    const controller =
      new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    let response;

    try {
      response = await fetch(
        GROQ_API_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content:
                  "You are Nova, the friendly AI assistant for Learnova - a Smart Student Engagement Ecosystem.",
              },
              {
                role: "user",
                content: trimmedMessage,
              },
            ],
            max_tokens: 400,
            temperature: 0.7,
          }),
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle API errors
    if (!response.ok) {
      const errorData =
        await response
          .json()
          .catch(() => ({}));

      return jsonError(
        errorData?.error?.message ||
          "Groq API request failed",
        response.status
      );
    }

    // Parse response
    const data = await response.json();

    const content =
      data?.choices?.[0]?.message
        ?.content;

    if (!content) {
      return jsonError(
        "AI generated an empty response",
        502
      );
    }

    console.log(
      `[nova-ai-quota-tracker] Success for ${decodedToken.uid}`
    );

    return jsonSuccess({
      message: content,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return jsonError(
        "Gateway Timeout: AI response took too long.",
        504
      );
    }

    console.error(
      "Groq API route error:",
      error
    );

    return jsonError(
      "Internal server error",
      500
    );
  }
}
