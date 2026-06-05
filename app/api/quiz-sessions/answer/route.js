import { connectDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { sessionId, questionId, answer, timestamp } = await req.json();

    if (!sessionId || !questionId || answer === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const db = await connectDb();

    // Validate session exists and not expired
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

    // Validate question exists in quiz
    const quiz = await db
      .collection("quizzes")
      .findOne({ _id: session.quizId });
    if (!quiz) {
      return new Response(
        JSON.stringify({ error: "Associated quiz not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const questionExists = quiz.questions.some((q) => q._id === questionId);

    if (!questionExists) {
      return new Response(
        JSON.stringify({ error: "Question not found in quiz" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Store answer server-side
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
  } catch (error) {
    console.error("Answer submission error:", error);
    return new Response(JSON.stringify({ error: "Failed to submit answer" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
