import { connectDb } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export const POST = withErrorHandler(async (req) => {
  const payload = await requireAuth(req);
  const { quizId } = await req.json();

  if (!quizId) {
    return new Response(JSON.stringify({ error: "Quiz ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = await connectDb();

  const quiz = await db.collection("quizzes").findOne({ _id: quizId });
  if (!quiz) {
    return new Response(JSON.stringify({ error: "Quiz not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);

  const session = {
    _id: sessionId,
    quizId,
    userId: payload.uid,
    createdAt: new Date(),
    expiresAt,
    answers: {},
    answeredAt: {},
    completed: false,
    submittedAt: null,
  };

  await db.collection("quiz_sessions").insertOne(session);

  return new Response(
    JSON.stringify({
      sessionId,
      expiresAt: expiresAt.toISOString(),
    }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
});
