export class AppError extends Error {
  constructor(message, statusCode = 500) {
    const msgStr = typeof message === "object" ? (message.message || JSON.stringify(message)) : message;
    super(msgStr);
    this.statusCode = statusCode;
    this.originalMessage = message;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}
