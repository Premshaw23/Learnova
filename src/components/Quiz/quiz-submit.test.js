import { describe, it, expect } from 'vitest';
import { verifyQuizSubmission, calculateHmacSignature, serializeDeterministic } from '../../../pages/api/quiz/submit.js';

describe('Server-side Quiz Submission & Anti-Tampering Security Tests (#4213)', () => {
  const secret = 'test-secret-key-123';
  const quizId = 'quiz-security-101';
  const correctAnswers = {
    q1: 'Option A',
    q2: 'Option C',
    q3: 'Option B',
  };

  it('calculates score correctly for valid signature and answers', () => {
    const answers = {
      q1: 'Option A',
      q2: 'Option C',
      q3: 'Wrong Answer',
    };
    const timestamp = Date.now();
    const dataToSign = `${quizId}:${serializeDeterministic(answers)}:${timestamp}`;
    const signature = calculateHmacSignature(dataToSign, secret);

    const result = verifyQuizSubmission({
      quizId,
      answers,
      timestamp,
      signature,
      secret,
      correctAnswers,
    });

    expect(result.score).toBe(2);
    expect(result.totalQuestions).toBe(3);
    expect(result.percentage).toBe(67);
    expect(result.passed).toBe(false); // < 70%
  });

  it('verifies HMAC signature deterministically regardless of key order', () => {
    const answers1 = { q1: 'A', q2: 'B' };
    const answers2 = { q2: 'B', q1: 'A' };
    const timestamp = Date.now();

    const dataToSign1 = `${quizId}:${serializeDeterministic(answers1)}:${timestamp}`;
    const dataToSign2 = `${quizId}:${serializeDeterministic(answers2)}:${timestamp}`;

    expect(calculateHmacSignature(dataToSign1, secret)).toBe(calculateHmacSignature(dataToSign2, secret));
  });

  it('passes quiz when score is >= 70%', () => {
    const answers = {
      q1: 'Option A',
      q2: 'Option C',
      q3: 'Option B',
    };
    const timestamp = Date.now();
    const dataToSign = `${quizId}:${serializeDeterministic(answers)}:${timestamp}`;
    const signature = calculateHmacSignature(dataToSign, secret);

    const result = verifyQuizSubmission({
      quizId,
      answers,
      timestamp,
      signature,
      secret,
      correctAnswers,
    });

    expect(result.score).toBe(3);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('rejects forged payload with invalid HMAC signature', () => {
    const answers = {
      q1: 'Option A',
      q2: 'Option C',
      q3: 'Option B',
    };
    const timestamp = Date.now();
    const forgedSignature = 'forged-signature-invalid-hex-12345';

    expect(() =>
      verifyQuizSubmission({
        quizId,
        answers,
        timestamp,
        signature: forgedSignature,
        secret,
        correctAnswers,
      })
    ).toThrow(/payload tampering detected/);
  });

  it('rejects replay attacks with expired timestamps (> 5 mins old)', () => {
    const answers = { q1: 'Option A' };
    const expiredTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    const dataToSign = `${quizId}:${serializeDeterministic(answers)}:${expiredTimestamp}`;
    const signature = calculateHmacSignature(dataToSign, secret);

    expect(() =>
      verifyQuizSubmission({
        quizId,
        answers,
        timestamp: expiredTimestamp,
        signature,
        secret,
        correctAnswers,
      })
    ).toThrow(/timestamp expired or invalid/);
  });

  it('rejects invalid quizId or empty answers payload', () => {
    const timestamp = Date.now();
    expect(() =>
      verifyQuizSubmission({
        quizId: '',
        answers: {},
        timestamp,
        signature: 'any',
        secret,
        correctAnswers,
      })
    ).toThrow(/Invalid quizId/);
  });
});
