import { connectDb } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function POST(req) {
  try {
    const { quizId } = await req.json();

    if (!quizId) {
      return new Response(JSON.stringify({ error: "Quiz ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await connectDb();

    // Get quiz metadata
    const quiz = await db.collection("quizzes").findOne({ _id: quizId });
    if (!quiz) {
      return new Response(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create session (simplified - in production use authenticated user ID)
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS);

    const session = {
      _id: sessionId,
      quizId,
      createdAt: new Date(),
      expiresAt,
      answers: {}, // Map of questionId -> answer
      answeredAt: {}, // Map of questionId -> timestamp
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
  } catch (error) {
    console.error("Quiz session creation error:", error);
    return new Response(JSON.stringify({ error: "Failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
