/**
 * app/api/quiz-sessions/route.js
 *
 * Server-side quiz session API endpoint.
 * All quiz answers and progress stored server-side in secure sessions.
 * Client only holds sessionId token.
 *
 * Prevents XSS attacks from modifying answers via localStorage.
 */

import { connectDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * POST /api/quiz-sessions/create
 * Create a new quiz session
 */
export async function POST(req) {
  try {
    const { quizId } = await req.json();

    if (!quizId) {
      return new Response(
        JSON.stringify({ error: 'Quiz ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = await connectDb();

    // Get quiz metadata
    const quiz = await db.collection('quizzes').findOne({ _id: quizId });
    if (!quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
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

    await db.collection('quiz_sessions').insertOne(session);

    return new Response(
      JSON.stringify({
        sessionId,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Quiz session creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/quiz-sessions/[sessionId]/answer
 * Submit an answer to a quiz question
 */
export async function submitAnswer(req, sessionId) {
  try {
    const { questionId, answer, timestamp } = await req.json();

    if (!sessionId || !questionId || answer === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = await connectDb();

    // Validate session exists and not expired
    const session = await db.collection('quiz_sessions').findOne({ _id: sessionId });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (new Date() > session.expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (session.completed) {
      return new Response(
        JSON.stringify({ error: 'Quiz already submitted' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate question exists in quiz
    const quiz = await db.collection('quizzes').findOne({ _id: session.quizId });
    const questionExists = quiz.questions.some((q) => q._id === questionId);

    if (!questionExists) {
      return new Response(
        JSON.stringify({ error: 'Question not found in quiz' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store answer server-side
    await db.collection('quiz_sessions').updateOne(
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
        message: 'Answer recorded',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Answer submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit answer' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/quiz-sessions/[sessionId]/submit
 * Submit completed quiz and calculate score
 */
export async function submitQuiz(req, sessionId) {
  try {
    const db = await connectDb();

    // Validate session
    const session = await db.collection('quiz_sessions').findOne({ _id: sessionId });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (new Date() > session.expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (session.completed) {
      return new Response(
        JSON.stringify({ error: 'Quiz already submitted' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get quiz for grading
    const quiz = await db.collection('quizzes').findOne({ _id: session.quizId });

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
    await db.collection('quiz_sessions').updateOne(
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
        feedback: passed ? 'Quiz passed!' : 'Quiz failed. Please review and try again.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Quiz submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit quiz' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
