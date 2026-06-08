import { z } from "zod";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const MAX_PAGE_LIMIT = 100;
const MAX_PAYLOAD_BYTES = 1024 * 50;

const conversationSchema = z
  .object({
    userMessage: z
      .string()
      .min(1, "User message is required")
      .max(10000, "User message too long (max 10000 chars)"),
    botMessage: z
      .string()
      .min(1, "Bot message is required")
      .max(10000, "Bot message too long (max 10000 chars)"),
  })
  .strict();

/**
 * GET /api/conversations — retrieves paginated conversation history for the authenticated user.
 */
export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const userId = decodedToken.uid;

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`conversations_get_${ip}_${userId}`);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit")) || 20),
    MAX_PAGE_LIMIT
  );
  const skip = (page - 1) * limit;

  const db = await connectDb();
  const conversations = await db
    .collection("conversations")
    .find({ userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  conversations.reverse();

  return jsonSuccess(conversations);
});

/**
 * POST /api/conversations — stores a new conversation exchange for the authenticated user.
 */
export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const userId = decodedToken.uid;

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`conversations_post_${ip}_${userId}`);
  if (!rateLimitResult.allowed) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await parseJSON(request, MAX_PAYLOAD_BYTES);
  const parsed = conversationSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message || "Invalid request payload"
    );
  }

  const { userMessage, botMessage } = parsed.data;

  const db = await connectDb();
  const conversation = {
    userId,
    userMessage,
    botMessage,
    timestamp: new Date().toISOString(),
  };

  const result = await db.collection("conversations").insertOne(conversation);

  return jsonSuccess({ _id: result.insertedId, ...conversation });
});
