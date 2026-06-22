import { jsonSuccess, jsonError } from "@/lib/api-response";
import {
  authenticateRequest,
  parseJSON,
  withErrorHandler,
} from "@/lib/error-handler";
import { callGroq } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 50; // 50KB for lecture notes

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const rateLimitResult = await checkRateLimit(decodedToken.uid);

  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const payload = await parseJSON(request, MAX_BODY_BYTES);
  const { notes } = payload;

  if (!notes || notes.trim() === "") {
    return jsonError("Lecture notes are required.", 400);
  }

  const prompt = `
You are an expert educational assistant.
Please provide a concise, well-structured summary of the following lecture notes or transcript.
Highlight the key takeaways, core concepts, and any important action items or assignments.
Keep the tone professional and educational. Format the output clearly.

Lecture Notes:
${notes}
  `;

  const summary = await callGroq(prompt);

  return jsonSuccess({ summary });
});
