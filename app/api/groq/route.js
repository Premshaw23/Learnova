import { jsonSuccess, jsonError } from "@/lib/api-response";
import { authenticateRequest, parseJSON, withErrorHandler } from "@/lib/error-handler";
import { validateGroqBody, callGroq } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/rateLimit";
import { detectInjection, sanitizeMessage } from "@/utils/promptGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  // Rate limiting by UID
  const rateLimitResult = await checkRateLimit(decodedToken.uid);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  // Parse body (Max 10KB)
  const body = await parseJSON(request, 1024 * 10);

  // Validate body using the library validator
  const validation = validateGroqBody(body);
  const trimmedMessage = validation.trimmedMessage;

  // Check for prompt injection
  const injectionCheck = detectInjection(trimmedMessage);
  if (injectionCheck.isInjection) {
    console.warn(`[nova-ai-safety] Injection blocked for user ${decodedToken.uid}: ${injectionCheck.matchedPattern}`);
    return jsonError("Safety check: System instructions override or prompt injection attempt detected.", 400);
  }

  // Sanitize user message
  const sanitizedMessage = sanitizeMessage(trimmedMessage);

  // Call Groq
  const content = await callGroq(sanitizedMessage);

  return jsonSuccess({ message: content });
});
