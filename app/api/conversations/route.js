import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { z } from "zod";

const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  // Strip <script> tags to prevent XSS injection
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
};

const conversationSchema = z.object({
  userMessage: z.string({
    required_error: "userMessage is required",
    invalid_type_error: "userMessage must be a string",
  })
  .min(1, "userMessage cannot be empty")
  .max(10000, "userMessage must not exceed 10,000 characters")
  .transform(sanitizeText),

  botMessage: z.string({
    required_error: "botMessage is required",
    invalid_type_error: "botMessage must be a string",
  })
  .min(1, "botMessage cannot be empty")
  .max(10000, "botMessage must not exceed 10,000 characters")
  .transform(sanitizeText),
});

export async function POST(req) {
  try {
    const authorization = req.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    // Enforce maximum document size (1MB = 1048576 bytes)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
      return jsonError("Payload too large", 413);
    }

    const rawText = await req.text();
    if (Buffer.byteLength(rawText, "utf8") > 1024 * 1024) {
      return jsonError("Payload too large", 413);
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawText);
    } catch (e) {
      return jsonError("Invalid JSON payload", 400);
    }

    // Validate using Zod
    const validation = conversationSchema.safeParse(parsedBody);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
      return jsonError(firstError, 400);
    }

    const { userMessage, botMessage } = validation.data;

    const db = await connectDb();
    const collection = db.collection("conversations");

    const newConversation = {
      userId: decodedToken.uid,
      userEmail: decodedToken.email,
      userMessage,
      botMessage,
      timestamp: new Date(),
    };

    await collection.insertOne(newConversation);

    return jsonSuccess(newConversation);
  } catch (err) {
    console.error("Save Message Error:", err);
    return jsonError(err.message || "Failed to save conversation", 500);
  }
}

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    const db = await connectDb();
    const collection = db.collection("conversations");

    const history = await collection
      .find({ userId: decodedToken.uid })
      .sort({ timestamp: 1 })
      .limit(50)
      .toArray();

    return jsonSuccess(history);
  } catch (err) {
    console.error("Get History Error:", err);
    return jsonError(err.message || "Failed to retrieve conversation history", 500);
  }
}

