const logger = require('./logger');
const AppError = require('./appError');

/**
 * Wraps a Next.js API Route Handler with centralized error handling and logging.
 * @param {Function} handler - The async route handler function (req, res, etc.)
 */
export function withErrorHandling(handler) {
  return async (req, ...args) => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      let statusCode = err.statusCode || 500;
      let message = err.message || 'Something went wrong on our end.';
      let errorCode = err.isOperational ? err.name : 'INTERNAL_SERVER_ERROR';

      // 1. Log the failure with metadata using Winston
      logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });

      // 2. Return consistent JSON response schema
      return new Response(
        JSON.stringify({
          status: 'error',
          code: errorCode,
          message,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}