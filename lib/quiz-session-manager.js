/**
 * lib/quiz-session-manager.js
 *
 * Secure quiz session management using server-side storage instead of
 * browser localStorage. Prevents XSS-based answer manipulation and
 * ensures quiz integrity.
 *
 * All quiz state is stored on server with encrypted sessionId tokens.
 * Client only holds sessionId, not actual answers or progress.
 */

/**
 * Generate a secure random session ID for quiz session.
 * @returns {string} Secure random session ID
 */
export function generateSessionId() {
  const array = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side usage
    const crypto = require("crypto");
    return crypto.randomBytes(32).toString("hex");
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Create a new quiz session via API.
 * Server creates session and stores quiz metadata server-side.
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} { sessionId, expiresAt }
 */
export async function createQuizSession(quizId) {
  if (!quizId || typeof quizId !== "string") {
    throw new Error("Invalid quiz ID");
  }

  const response = await fetch("/api/quiz-sessions/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quizId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create quiz session: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.sessionId) {
    throw new Error("No session ID returned from server");
  }

  return {
    sessionId: data.sessionId,
    expiresAt: data.expiresAt,
  };
}

/**
 * Submit an answer for a quiz question.
 * Server validates and stores answer server-side in session.
 * @param {string} sessionId - Quiz session ID
 * @param {string} questionId - Question ID
 * @param {any} answer - User's answer to question
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
export async function submitQuestionAnswer(sessionId, questionId, answer) {
  if (!sessionId || !questionId) {
    throw new Error("Session ID and question ID are required");
  }

  const response = await fetch("/api/quiz-sessions/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      sessionId,
      questionId,
      answer,
      timestamp: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit answer: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current quiz progress for a session.
 * Server returns only questionsAnswered count, not actual answers.
 * @param {string} sessionId - Quiz session ID
 * @returns {Promise<Object>} { questionsAnswered, totalQuestions }
 */
export async function getQuizProgress(sessionId) {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  const response = await fetch(`/api/quiz-sessions/${sessionId}/progress`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to get progress: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit completed quiz.
 * Server validates all answers and calculates score.
 * @param {string} sessionId - Quiz session ID
 * @returns {Promise<Object>} { score, percentage, passed, feedback }
 */
export async function submitQuiz(sessionId) {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  const response = await fetch("/api/quiz-sessions/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit quiz: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.score === undefined || result.percentage === undefined) {
    throw new Error("Invalid score response from server");
  }

  return result;
}

/**
 * Abandon/cancel a quiz session.
 * @param {string} sessionId - Quiz session ID
 * @returns {Promise<void>}
 */
export async function abandonQuizSession(sessionId) {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  const response = await fetch(`/api/quiz-sessions/${sessionId}/abandon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    console.error(`Failed to abandon session: ${response.statusText}`);
  }
}

/**
 * Store session ID securely in memory (not localStorage).
 * Optional: Can store in sessionStorage with expiration warning.
 * @param {string} quizId - Quiz ID
 * @param {string} sessionId - Session ID from server
 */
export function storeSessionId(quizId, sessionId) {
  // Use sessionStorage (cleared on tab close) instead of localStorage
  if (typeof sessionStorage !== "undefined") {
    const key = `quiz_session_${quizId}`;
    sessionStorage.setItem(
      key,
      JSON.stringify({
        sessionId,
        storedAt: Date.now(),
      })
    );
  }
}

/**
 * Retrieve session ID from sessionStorage.
 * @param {string} quizId - Quiz ID
 * @returns {string|null} Session ID or null if not found
 */
export function getStoredSessionId(quizId) {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const key = `quiz_session_${quizId}`;
  const stored = sessionStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    return parsed.sessionId || null;
  } catch (error) {
    console.error("Failed to parse stored session ID:", error);
    return null;
  }
}

/**
 * Clear stored session ID.
 * @param {string} quizId - Quiz ID
 */
export function clearStoredSessionId(quizId) {
  if (typeof sessionStorage !== "undefined") {
    const key = `quiz_session_${quizId}`;
    sessionStorage.removeItem(key);
  }
}

/**
 * IMPORTANT: DO NOT store quiz answers in localStorage!
 * All quiz data must be stored server-side in encrypted sessions.
 *
 * This function is intentionally undefined to prevent accidental misuse:
 */
export const NEVER_USE_LOCALSTORAGE_FOR_QUIZ_ANSWERS = null;
