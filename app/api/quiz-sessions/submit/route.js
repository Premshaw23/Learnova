import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req) => {
  const payload = await requireAuth(req);
  const { sessionId } = await req.json();

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

  let correctCount = 0;
  for (const question of quiz.questions) {
    const studentAnswer = session.answers[question._id];
    if (studentAnswer === question.correctAnswer) {
      correctCount++;
    }
  }

  const percentage = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = percentage >= (quiz.passingScore || 70);

  const submittedAt = new Date();
  await db.collection("quiz_sessions").updateOne(
    { _id: sessionId },
    {
      $set: {
        completed: true,
        submittedAt,
        score: correctCount,
        percentage,
        passed,
      },
    }
  );

  return new Response(
    JSON.stringify({
      score: correctCount,
      totalQuestions: quiz.questions.length,
      percentage,
      passed,
      feedback: passed
        ? "Quiz passed!"
        : "Quiz failed. Please review and try again.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
