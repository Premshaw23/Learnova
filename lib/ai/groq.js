import { z } from "zod";
import { AppError, ValidationError } from "@/lib/errors";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_SYSTEM_PROMPT = "You are Nova, the friendly AI assistant for Learnova - a Smart Student Engagement Ecosystem.";
const GROQ_MODEL = "llama-3.1-8b-instant";

const groqBodySchema = z.object({
  message: z.string().optional(),
  userMessage: z.string().optional(),
}).transform((data) => {
  const rawMessage = data.message ?? data.userMessage ?? "";
  return { trimmedMessage: rawMessage.trim() };
}).superRefine((data, ctx) => {
  if (!data.trimmedMessage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Message is required",
    });
    return;
  }

  if (data.trimmedMessage.length > 2000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Message too long (max 2000 characters)",
    });
  }
});

export function validateGroqBody(body) {
  const validation = groqBodySchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  return validation.data;
}

export function buildGroqRequest(trimmedMessage) {
  return {
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: GROQ_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: trimmedMessage,
      },
    ],
    max_tokens: 400,
    temperature: 0.7,
  };
}

export function extractGroqContent(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return null;
  }

  return content.trim() ? content : null;
}

export async function callGroq(trimmedMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError("Groq API key is not configured", 500);
  }

  const timeoutMs = parseInt(process.env.GROQ_TIMEOUT || "30000", 10);

  const response = await fetchWithTimeout(
    GROQ_API_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGroqRequest(trimmedMessage)),
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const upstreamMessage = errorData?.error?.message || "Groq API request failed";
    throw new AppError(upstreamMessage, response.status);
  }

  const data = await response.json().catch(() => null);
  const content = extractGroqContent(data);
  if (!content) {
    throw new AppError("AI generated an empty response", 502);
  }

  return content;
}