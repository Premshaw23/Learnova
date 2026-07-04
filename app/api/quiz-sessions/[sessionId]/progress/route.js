import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req, { params }) => {
  const payload = await requireAuth(req);
  const { sessionId } = await params;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Session ID is required" }), {
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

  const sessionUserId = session.userId || session.firebaseUid;
  if (sessionUserId !== payload.uid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const quiz = await db.collection("quizzes").findOne({ _id: session.quizId });

  return new Response(
    JSON.stringify({
      questionsAnswered: Object.keys(session.answers).length,
      totalQuestions: quiz.questions.length,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
