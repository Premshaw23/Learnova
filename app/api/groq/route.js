import { jsonSuccess, jsonError } from "@/lib/api-response";
import { authenticateRequest, parseJSON, withErrorHandler } from "@/lib/error-handler";
import { validateGroqBody, callGroq } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/rateLimit";
import { detectInjection, sanitizeMessage } from "@/utils/promptGuard";
import { GROQ_API_URL } from "@/lib/ai/groq";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  const rateLimitResult = await checkRateLimit(`groq_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 10);

  // Validate body using the library validator
  const validation = validateGroqBody(body);
  const { trimmedMessage, messages } = validation;

  const injectionCheck = detectInjection(trimmedMessage);
  if (injectionCheck.isInjection) {
    logger.warn(`[nova-ai-safety] Injection blocked for user ${decodedToken.uid}: ${injectionCheck.matchedPattern}`);
    return jsonError("Safety check: System instructions override or prompt injection attempt detected.", 400);
  }

  const sanitizedMessage = sanitizeMessage(trimmedMessage);

  try {
    logger.info(`[nova-ai] Making request to Groq API: ${GROQ_API_URL}`);
    const content = await callGroq(sanitizedMessage);
    return jsonSuccess({ message: content });
  } catch (error) {
    logger.error(`[nova-ai] Groq API error: ${error.message}`);
    if (error.name === "AbortError" || error.status === 504) {
      return jsonError("Gateway Timeout: Groq did not respond in time.", 504);
    }
    throw error;
  }
});
