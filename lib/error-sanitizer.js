/**
 * Sanitizes error messages to prevent leaking sensitive credentials in logs.
 * Redacts MongoDB URIs, API keys, and other sensitive patterns.
 *
 * @param {Error|string} error - The error object or message to sanitize
 * @returns {Error|string} Sanitized error with credentials redacted
 */
export function sanitizeErrorForLogging(error) {
  if (!error) return error;

  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;

    return str
      .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb$1://[redacted-credentials]@")
      .replace(/mongodb(\+srv)?:\/\/[^\s"']+/gi, "mongodb$1://[redacted-uri]")
      .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted-token]")
      .replace(/authorization:\s*"[^"]*"/gi, 'authorization: "[redacted]"')
      .replace(/password["\s:=]+[^\s,}]+/gi, 'password: [redacted]')
      .replace(/api[_-]?key["\s:=]+[^\s,}]+/gi, 'api_key: [redacted]')
      .replace(/secret["\s:=]+[^\s,}]+/gi, 'secret: [redacted]');
  };

  if (error instanceof Error) {
    const sanitized = new Error(sanitizeString(error.message));
    sanitized.name = error.name;
    sanitized.stack = error.stack ? sanitizeString(error.stack) : undefined;

    for (const key in error) {
      if (error.hasOwnProperty(key)) {
        sanitized[key] = typeof error[key] === "string"
          ? sanitizeString(error[key])
          : error[key];
      }
    }

    return sanitized;
  }

  return sanitizeString(String(error));
}

/**
 * Safe wrapper for console.error that sanitizes sensitive data.
 * Use this instead of console.error in API routes.
 *
 * @param {string} message - The log message prefix
 * @param {Error|any} error - The error to log
 * @returns {void}
 */
export function safeConsoleError(message, error) {
  const sanitized = sanitizeErrorForLogging(error);
  console.error(message, sanitized);
}
