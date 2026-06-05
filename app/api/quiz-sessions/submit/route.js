import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await connectDb();

    // Validate session
    const session = await db
      .collection("quiz_sessions")
      .findOne({ _id: sessionId });
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
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

    // Get quiz for grading
    const quiz = await db
      .collection("quizzes")
      .findOne({ _id: session.quizId });
    if (!quiz) {
      return new Response(
        JSON.stringify({ error: "Associated quiz not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Grade answers
    let correctCount = 0;
    for (const question of quiz.questions) {
      const studentAnswer = session.answers[question._id];
      if (studentAnswer === question.correctAnswer) {
        correctCount++;
      }
    }

    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = percentage >= (quiz.passingScore || 70);

    // Mark session as completed
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
  } catch (error) {
    console.error("Quiz submission error:", error);
    return new Response(JSON.stringify({ error: "Failed to submit quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
