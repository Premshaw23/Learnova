import { ObjectId } from "mongodb";
import { connectDb } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/rbac";

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export async function POST(req) {
  try {
    const decodedToken = await requireAuth(req);
    const { quizId } = await req.json();

    if (!quizId) {
      return new Response(JSON.stringify({ error: "Quiz ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let objectId;
    try {
      objectId = new ObjectId(quizId);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid Quiz ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await connectDb();

    const quiz = await db.collection("quizzes").findOne({ _id: objectId });
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
      userId: decodedToken.uid,
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
  } catch (error) {
    if (error.statusCode === 401 || error.name === "AuthenticationError") {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function submitAnswer(req, sessionId) {
  try {
    const decodedToken = await requireAuth(req);
    const { questionId, answer, timestamp } = await req.json();

    if (!sessionId || !questionId || answer === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    if (session.firebaseUid && session.firebaseUid !== decodedToken.uid) {
      return new Response(JSON.stringify({ error: "Not authorized to answer this session" }), {
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

    const quiz = await db
      .collection("quizzes")
      .findOne({ _id: session.quizId });
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
  } catch (error) {
    if (error.statusCode === 401 || error.name === "AuthenticationError") {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Failed to submit answer" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function submitQuiz(req, sessionId) {
  try {
    const decodedToken = await requireAuth(req);
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

    if (session.firebaseUid && session.firebaseUid !== decodedToken.uid) {
      return new Response(JSON.stringify({ error: "Not authorized to submit this session" }), {
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

    const quiz = await db
      .collection("quizzes")
      .findOne({ _id: session.quizId });

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
  } catch (error) {
    if (error.statusCode === 401 || error.name === "AuthenticationError") {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Failed to submit quiz" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
