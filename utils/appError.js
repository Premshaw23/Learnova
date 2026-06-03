class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from system bugs

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
