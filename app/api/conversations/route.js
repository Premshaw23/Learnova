import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withSecurity } from "@/lib/security/middleware";
import { conversationSchema } from "@/lib/security/validation-schemas";

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

    // Validate using security middleware
    const validation = conversationSchema.safeParse(parsedBody);
    if (!validation.success) {
      const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
      return jsonError(firstError, 400);
    }

    const { userMessage, botMessage } = validation.data;

    // Apply rate limiting
    const securityResult = await withSecurity(req, { rateLimitType: 'strict' });
    if (securityResult instanceof Response) return securityResult;

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
