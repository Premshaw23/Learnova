import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function POST(req) {
  try {
    const { userMessage, botMessage } = await req.json();

    const db = await connectDb();
    const collection = db.collection("conversations");

    const newConversation = {
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
