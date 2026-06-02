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

  const rateLimitResult = await checkRateLimit(decodedToken.uid);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await parseJSON(request, 1024 * 10);

  // Validate body using the library validator
  const validation = validateGroqBody(body);
  const trimmedMessage = validation.trimmedMessage;

  const injectionCheck = detectInjection(trimmedMessage);
  if (injectionCheck.isInjection) {
    console.warn(`[nova-ai-safety] Injection blocked for user ${decodedToken.uid}: ${injectionCheck.matchedPattern}`);
    return jsonError("Safety check: System instructions override or prompt injection attempt detected.", 400);
  }

  const sanitizedMessage = sanitizeMessage(trimmedMessage);

  try {
    const content = await callGroq(sanitizedMessage, validation.messages, decodedToken.uid);
    return jsonSuccess({ message: content });
  } catch (error) {
    if (error.name === "AbortError" || error.status === 504) {
      return jsonError("Gateway Timeout: Groq did not respond in time.", 504);
    }
    throw error;
  }
});
