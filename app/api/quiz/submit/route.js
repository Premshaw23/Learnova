import { verifyQuizSubmission } from '../../../../pages/api/quiz/submit.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const secret = process.env.QUIZ_HMAC_SECRET || 'learnova-quiz-secret-key';
    const { quizId, answers, timestamp, signature, correctAnswers } = body || {};

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing submission signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = verifyQuizSubmission({
      quizId,
      answers,
      timestamp,
      signature,
      secret,
      correctAnswers: correctAnswers || {},
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Quiz submission failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
