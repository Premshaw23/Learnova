import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req) => {
  const payload = await requireAuth(req);
  const { sessionId, questionId, answer, timestamp } = await req.json();

  if (!sessionId || !questionId || answer === undefined) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = await connectDb();

  const session = await db
    .collection("quiz_sessions")
    .findOne({ _id: sessionId });
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (session.userId !== payload.uid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (new Date() > session.expiresAt) {
    return new Response(JSON.stringify({ error: "Session expired" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (session.completed) {
    return new Response(JSON.stringify({ error: "Quiz already submitted" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const quiz = await db.collection("quizzes").findOne({ _id: session.quizId });
  const questionExists = quiz.questions.some((q) => q._id === questionId);

  if (!questionExists) {
    return new Response(
      JSON.stringify({ error: "Question not found in quiz" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  await db.collection("quiz_sessions").updateOne(
    { _id: sessionId },
    {
      $set: {
        [`answers.${questionId}`]: answer,
        [`answeredAt.${questionId}`]: new Date(timestamp || Date.now()),
      },
    }
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: "Answer recorded",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
