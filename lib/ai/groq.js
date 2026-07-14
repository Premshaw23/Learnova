import { z } from "zod";
import crypto from "crypto";
import { AppError, ValidationError } from "@/lib/errors";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getRedis } from "@/lib/redis";
import { buildSecureMessages } from "@/utils/promptGuard";

function getCacheClient() {
  return getRedis();
}

const CACHE_TTL_SECONDS = 3600;

function buildCacheKey(userId, trimmedMessage, messages) {
  const hist = (messages || []).map((m) => `${m.role}:${m.content}`).join("|");
  const hash = crypto
    .createHash("md5")
    .update(`${trimmedMessage}||${hist}`)
    .digest("hex");
  return `groq_cache:${userId}:${hash}`;
}

export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_SYSTEM_PROMPT =
  "You are Nova, the friendly AI assistant for Learnova - a Smart Student Engagement Ecosystem.";
const GROQ_MODEL = "llama-3.1-8b-instant";

const groqBodySchema = z
  .object({
    message: z.string().optional(),
    userMessage: z.string().optional(),
    messages: z
      .array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      )
      .optional(),
    context: z.record(z.any()).optional(),
  })
  .transform((data) => {
    let rawMessage;
    let historyMessages;
    if (data.message || data.userMessage) {
      rawMessage = data.message ?? data.userMessage ?? "";
      historyMessages = [];
    } else if (data.messages && data.messages.length > 0) {
      const lastUserIdx = [...data.messages]
        .reverse()
        .findIndex((m) => m.role === "user");
      if (lastUserIdx !== -1) {
        const lastUserMsg =
          data.messages[data.messages.length - 1 - lastUserIdx];
        rawMessage = lastUserMsg.content ?? "";
        historyMessages = data.messages.filter(
          (_, i) => i !== data.messages.length - 1 - lastUserIdx
        );
      } else {
        rawMessage = "";
        historyMessages = data.messages;
      }
    } else {
      rawMessage = "";
      historyMessages = [];
    }
    return {
      trimmedMessage: rawMessage.trim(),
      messages: historyMessages,
      context: data.context || {},
    };
  })
  .superRefine((data, ctx) => {
    if (!data.trimmedMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message is required",
      });
      return;
    }

    if (data.trimmedMessage.length > 10000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message too long (max 2000 characters)",
      });
    }
  });

export function validateGroqBody(body) {
  const validation = groqBodySchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  return validation.data;
}

export function buildGroqRequest(trimmedMessage, messages = [], context = {}) {
  let systemContent = GROQ_SYSTEM_PROMPT;
  if (context && Object.keys(context).length > 0) {
    systemContent += `\n\nUser Context:\n${JSON.stringify(context, null, 2)}`;
  }
  const conversationHistory = messages.filter((m) => m.role !== "system");

  const MAX_TOKENS = 8192;
  const RESPONSE_TOKENS = 400;

  // Use buildSecureMessages to include prompt injection defense
  const secureMessages = buildSecureMessages(
    trimmedMessage,
    systemContent,
    conversationHistory
  );

  const SYSTEM_TOKENS = Math.ceil(secureMessages[0].content.length / 4);
  const availableTokens = MAX_TOKENS - RESPONSE_TOKENS - SYSTEM_TOKENS;
  const maxInputChars = availableTokens * 4;

  const resultMessages = [...secureMessages];

  let totalChars = resultMessages.reduce((sum, m) => sum + m.content.length, 0);

  while (totalChars > maxInputChars && resultMessages.length > 2) {
    const removed = resultMessages.splice(1, 1)[0];
    totalChars -= removed.content.length;
  }

  return {
    model: GROQ_MODEL,
    messages: resultMessages,
    max_tokens: RESPONSE_TOKENS,
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

export async function callGroq(
  trimmedMessage,
  messages = [],
  userId = "anonymous",
  context = {}
) {
  const redis = getCacheClient();
  const cacheKey = buildCacheKey(userId, trimmedMessage, messages);

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached && typeof cached === "string" && cached.trim()) {
        return cached;
      }
    } catch {
      // cache miss — continue to call API
    }
  }

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
      body: JSON.stringify(buildGroqRequest(trimmedMessage, messages, context)),
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const upstreamMessage =
      errorData?.error?.message || "Groq API request failed";
    throw new AppError(upstreamMessage, response.status);
  }

  const data = await response.json().catch(() => null);
  const content = extractGroqContent(data);
  if (!content) {
    throw new AppError("AI generated an empty response", 502);
  }

  if (redis) {
    try {
      await redis.set(cacheKey, content, { ex: CACHE_TTL_SECONDS });
    } catch {
      // non-blocking: cache write failure is acceptable
    }
  }

  return content;
}
