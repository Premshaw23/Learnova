import { connectDb } from "@/lib/mongodb";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess, jsonError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req) => {
  const { payload: decodedToken } = await requireRole(req, ["teacher", "parent"]);
  const userId = decodedToken.uid;
  const db = await connectDb();

  // Fetch messages where user is either sender or recipient
  const messages = await db.collection("direct_messages").find({
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ]
  }).sort({ createdAt: 1 }).toArray();

  // Also return list of contactable users depending on role
  let contacts = [];
  if (decodedToken.role === "teacher") {
    // Teachers can message parents of their students (mocking all parents for now)
    contacts = await db.collection("users").find({ role: "parent" }).project({ displayName: 1, email: 1, role: 1 }).toArray();
  } else if (decodedToken.role === "parent") {
    // Parents can message teachers
    contacts = await db.collection("users").find({ role: "teacher" }).project({ displayName: 1, email: 1, role: 1 }).toArray();
  }

  return jsonSuccess({
    messages,
    contacts: contacts.map(c => ({ id: c._id.toString() || c.firebaseUid, name: c.displayName || c.email }))
  });
});

export const POST = withErrorHandler(async (req) => {
  const { payload: decodedToken } = await requireRole(req, ["teacher", "parent"]);
  const senderId = decodedToken.uid;
  
  const body = await req.json();
  const { recipientId, content } = body;

  if (!recipientId || !content) {
    return jsonError("Missing required fields", 400);
  }

  const db = await connectDb();
  
  const newMessage = {
    senderId,
    recipientId,
    content,
    read: false,
    createdAt: new Date()
  };

  await db.collection("direct_messages").insertOne(newMessage);

  // Trigger real-time event if SSE is connected
  try {
    const ssePublisher = require('@/lib/ssePublisher').default;
    if (ssePublisher) {
      ssePublisher.publish(recipientId, {
        type: 'NEW_MESSAGE',
        payload: newMessage
      });
    }
  } catch (e) {
    // SSE optional
  }

  return jsonSuccess({ message: "Message sent successfully!", data: newMessage });
});
