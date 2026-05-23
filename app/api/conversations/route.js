import { connectDb } from "@/lib/mongodb";
import { jsonSuccess } from "@/lib/api-response";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

// Force dynamic rendering to prevent build-time database connection errors
export const dynamic = "force-dynamic";

/**
 * Sanitizes incoming text streams to eliminate malicious script or markup tags 
 * while maintaining Markdown symbols for UI representation.
 */
const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  // Use sanitize-html to prevent XSS attacks including script tags, onerror attributes, etc.
  return sanitizeHtml(text, {
    allowedTags: [], // Disallow all HTML tags
    allowedAttributes: {}, // Disallow all HTML attributes
    text: true, // Allow text content only
  }).trim();
};

const conversationSchema = z.object({
  userMessage: z
    .string({
      required_error: "userMessage is required",
      invalid_type_error: "userMessage must be a string",
    })
    .min(1, "userMessage cannot be empty")
    .max(10000, "userMessage must not exceed 10,000 characters")
    .transform(sanitizeText),

  botMessage: z
    .string({
      required_error: "botMessage is required",
      invalid_type_error: "botMessage must be a string",
    })
    .min(1, "botMessage cannot be empty")
    .max(10000, "botMessage must not exceed 10,000 characters")
    .transform(sanitizeText),
});

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req);

  // Enforce payload constraint
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


  const db = await connectDb();

  // Sorted by newest first (-1) to fetch recent activity
  const history = await db.collection("conversations")
    .find({ userId: decodedToken.uid })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  return jsonSuccess(history.reverse());
});