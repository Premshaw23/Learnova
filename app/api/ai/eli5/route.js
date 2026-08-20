import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { callGroq } from "@/lib/ai/groq";

export const POST = withErrorHandler(async (req) => {
  await requireRole(req, ["student", "teacher", "parent"]);
  
  const body = await req.json();
  const { text } = body;

  if (!text) {
    return jsonError("Text is required", 400);
  }

  const prompt = `Explain the following concept simply, using easy-to-understand analogies, as if you were explaining it to a 5-year-old child. Keep it brief (under 100 words).\n\nConcept: "${text}"`;

  try {
    const explanation = await callGroq(prompt, "llama-3.1-8b-instant", { temperature: 0.7 });
    return jsonSuccess({ explanation: explanation.trim() });
  } catch (error) {
    return jsonError("Failed to generate ELI5 explanation", 500);
  }
});
