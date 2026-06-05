import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req, context) {
  try {
    const { sessionId } = context.params;

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

    // Get quiz metadata to know total questions
    const quiz = await db
      .collection("quizzes")
      .findOne({ _id: session.quizId });
    if (!quiz) {
      return new Response(
        JSON.stringify({ error: "Associated quiz not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const questionsAnswered = Object.keys(session.answers || {}).length;
    const totalQuestions = quiz.questions.length;

    return new Response(
      JSON.stringify({
        questionsAnswered,
        totalQuestions,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Quiz session progress error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get quiz session progress" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
