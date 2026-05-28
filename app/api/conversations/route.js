import { connectDb } from "@/lib/mongodb";
import { jsonSuccess } from "@/lib/api-response";
import { z } from "zod";

import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { AppError, ValidationError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

// Force dynamic rendering to prevent build-time database connection errors
export const dynamic = "force-dynamic";

/**
 * Escapes HTML tag brackets and dangerous special characters inside incoming 
 * text streams to completely eliminate malicious script or markup execution,
 * while maintaining standard Markdown symbols for UI representation.
 * Follows OWASP recommendations by escaping &, <, >, ", ', and /.
 */
const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
};

const conversationSchema = z.object({
  userMessage: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "userMessage is required"
          : "userMessage must be a string",
    })
    .min(1, "userMessage cannot be empty")
    .max(10000, "userMessage must not exceed 10,000 characters")
    .transform(sanitizeText),

  botMessage: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "botMessage is required"
          : "botMessage must be a string",
    })
    .min(1, "botMessage cannot be empty")
    .max(10000, "botMessage must not exceed 10,000 characters")
    .transform(sanitizeText),
});

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req);
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`conversations_post_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const rawText = await req.text();
  const byteLength = new TextEncoder().encode(rawText).length;
  if (byteLength > 1024 * 1024) {
    throw new AppError("Payload too large", 413);
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(rawText);
  } catch (e) {
    throw new ValidationError("Invalid JSON payload");
  }

  const validation = conversationSchema.safeParse(parsedBody);
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { userMessage, botMessage } = validation.data;
  const db = await connectDb();
  
  const newConversation = {
    userId: decodedToken.uid,
    userEmail: decodedToken.email,
    userMessage,
    botMessage,
    timestamp: new Date(),
  };

  await db.collection("conversations").insertOne(newConversation);

  return jsonSuccess(newConversation);
});

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`conversations_get_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const db = await connectDb();

  // Sorted by newest first (-1) to fetch recent activity
  const history = await db.collection("conversations")
    .find({ userId: decodedToken.uid })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  return jsonSuccess(history.reverse());
});