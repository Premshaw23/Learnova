import crypto from "crypto";

/**
 * Server-side quiz session manager
 * CRITICAL: All quiz answers must be stored server-side, never in localStorage
 * Prevents XSS attacks from stealing or modifying quiz responses
 */

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const SESSION_TOKEN_LENGTH = 32;

/**
 * Generate cryptographically secure session token
 */
function generateSessionToken() {
  return crypto.randomBytes(SESSION_TOKEN_LENGTH).toString("hex");
}

/**
 * Validate session token format and expiration
 */
function validateSessionToken(token) {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Invalid token format" };
  }

  if (token.length !== SESSION_TOKEN_LENGTH * 2) {
    // hex encoding doubles the length
    return { valid: false, reason: "Token length mismatch" };
  }

  if (!/^[a-f0-9]+$/.test(token)) {
    return { valid: false, reason: "Token contains invalid characters" };
  }

  return { valid: true };
}

/**
 * Create or retrieve quiz session
 * Returns a secure session token for quiz operations
 */
export async function createQuizSession(db, userId, quizId) {
  if (!userId || !quizId) {
    throw new Error("userId and quizId are required");
  }

  const sessionToken = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS);

  const session = {
    sessionToken,
    userId,
    quizId,
    answers: {},
    startedAt: now,
    expiresAt,
    lastActivityAt: now,
    isSubmitted: false,
    submittedAt: null,
    metadata: {
      browserFingerprint: null,
      ipAddress: null,
    },
  };

  // Store session server-side
  await db.collection("quiz_sessions").insertOne(session);

  return {
    sessionToken,
    expiresAt,
    quizId,
  };
}

/**
 * Save quiz answer with server-side validation
 * CRITICAL: All answer persistence is server-side only
 */
export async function saveQuizAnswer(db, sessionToken, questionId, answer, userId) {
  // Validate session token format first
  const tokenValidation = validateSessionToken(sessionToken);
  if (!tokenValidation.valid) {
    throw new Error(`Invalid session token: ${tokenValidation.reason}`);
  }

  if (!questionId || !answer) {
    throw new Error("questionId and answer are required");
  }

  // Retrieve and validate session
  const session = await db.collection("quiz_sessions").findOne({
    sessionToken,
    isSubmitted: false,
  });

  if (!session) {
    throw new Error("Quiz session not found or already submitted");
  }

  // Validate user ownership
  if (session.userId !== userId) {
    throw new Error("Session belongs to different user");
  }

  // Validate session hasn't expired
  const now = new Date();
  if (now > session.expiresAt) {
    throw new Error("Quiz session has expired");
  }

  // CRITICAL: Sanitize answer data to prevent XSS injection
  const sanitizedAnswer = sanitizeQuizAnswer(answer);

  // Update answer server-side only
  await db.collection("quiz_sessions").updateOne(
    { sessionToken, userId },
    {
      $set: {
        [`answers.${questionId}`]: {
          answer: sanitizedAnswer,
          savedAt: new Date(),
          ipAddress: null, // To be filled by middleware
        },
        lastActivityAt: new Date(),
      },
    }
  );

  return { success: true, questionId };
}

/**
 * Sanitize quiz answer to prevent XSS injection
 */
function sanitizeQuizAnswer(answer) {
  if (typeof answer === "string") {
    // Remove any HTML/script tags
    return answer
      .replace(/<[^>]*>/g, "")
      .trim()
      .substring(0, 10000); // Max 10KB
  }

  if (typeof answer === "number") {
    return answer;
  }

  if (Array.isArray(answer)) {
    return answer.map(item =>
      typeof item === "string" ? item.replace(/<[^>]*>/g, "").trim() : item
    ).slice(0, 100); // Max 100 items
  }

  if (typeof answer === "object" && answer !== null) {
    return Object.fromEntries(
      Object.entries(answer).map(([k, v]) => [
        k.replace(/<[^>]*>/g, "").trim(),
        typeof v === "string" ? v.replace(/<[^>]*>/g, "").trim() : v,
      ])
    );
  }

  return answer;
}

/**
 * Submit quiz and lock answers
 * CRITICAL: Validate answers before marking as submitted
 */
export async function submitQuiz(db, sessionToken, userId) {
  const tokenValidation = validateSessionToken(sessionToken);
  if (!tokenValidation.valid) {
    throw new Error(`Invalid session token: ${tokenValidation.reason}`);
  }

  const session = await db.collection("quiz_sessions").findOne({
    sessionToken,
    userId,
    isSubmitted: false,
  });

  if (!session) {
    throw new Error("Quiz session not found");
  }

  const now = new Date();
  if (now > session.expiresAt) {
    throw new Error("Quiz session has expired");
  }

  // Validate that answers exist
  if (!session.answers || Object.keys(session.answers).length === 0) {
    throw new Error("No answers provided");
  }

  // Mark as submitted and lock answers
  await db.collection("quiz_sessions").updateOne(
    { sessionToken, userId },
    {
      $set: {
        isSubmitted: true,
        submittedAt: now,
        lastActivityAt: now,
      },
    }
  );

  return {
    success: true,
    sessionToken,
    submittedAt: now,
  };
}

/**
 * Retrieve quiz answers (server-side only)
 * CRITICAL: Only allow retrieval server-side, never send answers to client
 */
export async function getQuizAnswers(db, sessionToken, userId) {
  const tokenValidation = validateSessionToken(sessionToken);
  if (!tokenValidation.valid) {
    throw new Error(`Invalid session token: ${tokenValidation.reason}`);
  }

  const session = await db.collection("quiz_sessions").findOne({
    sessionToken,
    userId,
    isSubmitted: true,
  });

  if (!session) {
    throw new Error("Quiz session not found or not submitted");
  }

  return {
    sessionToken,
    quizId: session.quizId,
    userId: session.userId,
    answers: session.answers,
    submittedAt: session.submittedAt,
    expiresAt: new Date(session.submittedAt.getTime() + SESSION_TIMEOUT_MS),
  };
}

/**
 * Clean up expired quiz sessions
 */
export async function cleanupExpiredSessions(db) {
  const now = new Date();

  const result = await db.collection("quiz_sessions").deleteMany({
    expiresAt: { $lt: now },
  });

  console.log(`[Quiz Sessions] Cleaned up ${result.deletedCount} expired sessions`);

  return result.deletedCount;
}

/**
 * Middleware to validate quiz session on every request
 */
export async function requireQuizSession(db, sessionToken, userId) {
  const tokenValidation = validateSessionToken(sessionToken);
  if (!tokenValidation.valid) {
    return {
      authorized: false,
      error: "Invalid session token format",
    };
  }

  const session = await db.collection("quiz_sessions").findOne({
    sessionToken,
    userId,
  });

  if (!session) {
    return {
      authorized: false,
      error: "Quiz session not found",
    };
  }

  const now = new Date();
  if (now > session.expiresAt) {
    return {
      authorized: false,
      error: "Session has expired",
    };
  }

  if (session.isSubmitted) {
    return {
      authorized: false,
      error: "Quiz has already been submitted",
    };
  }

  return {
    authorized: true,
    session,
  };
}
