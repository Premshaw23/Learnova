import crypto from 'node:crypto';

/**
 * Quiz Submission anti-tampering & server-side score validation.
 * Verifies HMAC signature of quiz submissions and calculates scores server-side.
 */

/**
 * Loads the authoritative answer key for a quiz from the database, keyed by
 * question id. The correct answers must never come from the request body.
 * DB deps are imported dynamically so importing this module (e.g. for the pure
 * verifyQuizSubmission unit tests) doesn't pull in the Mongo driver.
 */
export async function loadCorrectAnswers(quizId) {
  const { ObjectId } = await import('mongodb');
  const { connectDb } = await import('@/lib/mongodb');
  let objectId;
  try {
    objectId = new ObjectId(quizId);
  } catch {
    return null;
  }
  const db = await connectDb();
  const quiz = await db.collection('quizzes').findOne({ _id: objectId });
  if (!quiz || !Array.isArray(quiz.questions)) {
    return null;
  }
  const correctAnswers = {};
  for (const q of quiz.questions) {
    correctAnswers[q._id] = q.correctAnswer;
  }
  return correctAnswers;
}

export function calculateHmacSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Helper to serialize objects with sorted keys for deterministic HMAC generation
 */
export function serializeDeterministic(obj) {
  if (!obj || typeof obj !== 'object') return String(obj);
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  return JSON.stringify(sortedObj);
}

export function verifyQuizSubmission({
  quizId,
  answers,
  timestamp,
  signature,
  secret,
  correctAnswers = {},
}) {
  if (!quizId || typeof quizId !== 'string') {
    throw new Error('Invalid quizId');
  }
  if (!answers || typeof answers !== 'object') {
    throw new Error('Invalid answers payload');
  }
  if (!timestamp || typeof timestamp !== 'number') {
    throw new Error('Invalid timestamp');
  }

  // Check request timestamp freshness (prevent replay attacks > 5 mins)
  const now = Date.now();
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    throw new Error('Quiz submission timestamp expired or invalid');
  }

  // Verify HMAC signature deterministically
  const dataToSign = `${quizId}:${serializeDeterministic(answers)}:${timestamp}`;
  const expectedSignature = calculateHmacSignature(dataToSign, secret);

  if (signature !== expectedSignature) {
    throw new Error('Quiz submission signature verification failed — payload tampering detected');
  }

  // Server-side score calculation against answer keys
  let score = 0;
  const totalQuestions = Object.keys(correctAnswers).length;

  for (const [qId, correctAnswer] of Object.entries(correctAnswers)) {
    if (answers[qId] === correctAnswer) {
      score++;
    }
  }

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passed = percentage >= 70;

  return {
    quizId,
    score,
    totalQuestions,
    percentage,
    passed,
    submittedAt: new Date(timestamp).toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const secret = process.env.QUIZ_HMAC_SECRET;
    if (!secret) {
      // Fail closed — a hardcoded fallback secret let anyone forge signatures.
      return res
        .status(500)
        .json({ error: 'Quiz submission is not configured (missing QUIZ_HMAC_SECRET)' });
    }

    const { quizId, answers, timestamp, signature } = req.body || {};

    if (!signature) {
      return res.status(400).json({ error: 'Missing submission signature' });
    }

    // Correct answers come from the server, never from the client body.
    const correctAnswers = await loadCorrectAnswers(quizId);
    if (!correctAnswers) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const result = verifyQuizSubmission({
      quizId,
      answers,
      timestamp,
      signature,
      secret,
      correctAnswers,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Quiz submission failed' });
  }
}
