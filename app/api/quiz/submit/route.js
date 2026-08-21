import {
  verifyQuizSubmission,
  loadCorrectAnswers,
} from '../../../../pages/api/quiz/submit.js';

export async function POST(req) {
  const json = (body, status) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const secret = process.env.QUIZ_HMAC_SECRET;
    if (!secret) {
      // Fail closed — a hardcoded fallback secret let anyone forge signatures.
      return json(
        { error: 'Quiz submission is not configured (missing QUIZ_HMAC_SECRET)' },
        500
      );
    }

    const body = await req.json();
    const { quizId, answers, timestamp, signature } = body || {};

    if (!signature) {
      return json({ error: 'Missing submission signature' }, 400);
    }

    // Correct answers come from the server, never from the client body.
    const correctAnswers = await loadCorrectAnswers(quizId);
    if (!correctAnswers) {
      return json({ error: 'Quiz not found' }, 404);
    }

    const result = verifyQuizSubmission({
      quizId,
      answers,
      timestamp,
      signature,
      secret,
      correctAnswers,
    });

    return json(result, 200);
  } catch (error) {
    return json({ error: error.message || 'Quiz submission failed' }, 400);
  }
}
