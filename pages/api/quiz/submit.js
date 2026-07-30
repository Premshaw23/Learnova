import crypto from 'node:crypto';

/**
 * Quiz Submission anti-tampering & server-side score validation.
 * Verifies HMAC signature of quiz submissions and calculates scores server-side.
 */

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
    const secret = process.env.QUIZ_HMAC_SECRET || 'learnova-quiz-secret-key';
    const { quizId, answers, timestamp, signature, correctAnswers } = req.body || {};

    if (!signature) {
      return res.status(400).json({ error: 'Missing submission signature' });
    }

    const result = verifyQuizSubmission({
      quizId,
      answers,
      timestamp,
      signature,
      secret,
      correctAnswers: correctAnswers || {},
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Quiz submission failed' });
  }
}
