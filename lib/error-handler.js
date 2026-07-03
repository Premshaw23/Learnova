import { jsonError } from "@/lib/api-response";
import { AppError, ValidationError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { monitorError, trackApiExecution } from "./error-monitor";
import { logger } from "./logger";
import { validateSession } from "@/lib/sessionManager";

/**
 * Reads the request body as text, validates its byte size before
 * parsing JSON.  Prevents memory exhaustion from oversized payloads.
 *
 * @param {Request} request
 * @param {number} maxBytes - Maximum allowed payload size in bytes.
 * @returns {Promise<Object>} Parsed JSON body.
 */
export async function parseJSON(request, maxBytes = 1024 * 1024) {
  const contentLength = Number(request.headers.get("content-length"));

  if (!Number.isNaN(contentLength) && contentLength > maxBytes) {
    throw new AppError(
      `Payload too large (${contentLength} bytes, limit ${maxBytes})`,
      413
    );
  }

  const raw = await request.text();

  const bytes = new TextEncoder().encode(raw).length;

  if (bytes > maxBytes) {
    throw new AppError(
      `Payload too large (${bytes} bytes, limit ${maxBytes})`,
      413
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError("Invalid JSON payload");
  }
}

/**
 * Robust request authentication helper.
 * Handles both production { valid, decodedToken } structure and test mocks that return null or decoded token payload directly.
 *
 * @param {Request} request
 * @returns {Promise<Object>} The decoded token payload
 */
export async function authenticateRequest(request) {
  let token;
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    token = authorization.split(" ")[1];
  }

  if (!token && request.cookies) {
    token = request.cookies.get("authToken")?.value;
  }

  if (!token) {
    throw new UnauthorizedError("Unauthorized");
  }

  const authResult = await verifyFirebaseToken(token);

  if (!authResult) {
    throw new UnauthorizedError("Unauthorized");
  }

  // Handle mock token payload returned directly in tests
  let decodedPayload = null;
  if (typeof authResult === "object") {
    if ("valid" in authResult) {
      if (!authResult.valid) {
        throw new UnauthorizedError("Unauthorized");
      }
      decodedPayload = authResult.decodedToken;
    } else if (authResult.uid) {
      decodedPayload = authResult;
    }
  }

  if (!decodedPayload) {
    throw new UnauthorizedError("Unauthorized");
  }

  // Validate required token claims are present
  if (!decodedPayload.uid && !decodedPayload.sub) {
    logger.warn("Token missing required subject claim", {
      path: request.nextUrl?.pathname,
    });
    throw new UnauthorizedError("Unauthorized");
  }

  // Validate stateful session is present and valid
  // Sessions are mandatory when Redis is configured - skipping this check
  // when a session ID is absent allowed attackers to bypass session invalidation
  const sessionId =
    request.cookies?.get("sessionId")?.value ||
    request.headers.get("x-session-id");

  const redisConfigured =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisConfigured) {
    if (!sessionId) {
      logger.warn("Missing session ID on authenticated request", {
        uid: decodedPayload.uid || decodedPayload.sub,
        path: request.nextUrl?.pathname,
      });
      throw new UnauthorizedError("Session required");
    }

    const isSessionValid = await validateSession(sessionId);
    if (!isSessionValid) {
      logger.warn("Invalid or expired session", {
        uid: decodedPayload.uid || decodedPayload.sub,
        sessionId: sessionId.slice(0, 8),
        path: request.nextUrl?.pathname,
      });
      throw new UnauthorizedError(
        "Session expired or terminated concurrently."
      );
    }
  }

  return decodedPayload;
}

export function withErrorHandler(handler) {
  return async function (request, ...args) {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    let statusCode = 500;

    try {
      logger.info("Incoming API request", {
        method: request.method,
        route: request.nextUrl?.pathname,
      });

      const response = await handler(request, ...args);
      statusCode = response?.status || 200;
      return response;
    } catch (error) {
      if (error instanceof AppError) {
        statusCode = error.statusCode;
        const payload =
          error.originalMessage !== undefined
            ? error.originalMessage
            : error.message;
        if (payload && typeof payload === "object") {
          return jsonError(
            {
              code: payload.code || `HTTP_${statusCode}`,
              message: payload.message || error.message,
              details: payload.details ?? null,
            },
            statusCode
          );
        }

        return jsonError(
          {
            code: `HTTP_${statusCode}`,
            message: payload,
            details: null,
          },
          statusCode
        );
      }

      if (error.name === "AbortError") {
        statusCode = 504;
        monitorError(error, {
          type: "TIMEOUT_ERROR",
          route: request?.nextUrl?.pathname,
          method: request?.method,
        });

        return jsonError(
          {
            code: "GATEWAY_TIMEOUT",
            message: "Gateway Timeout: Operation did not respond in time.",
            details: null,
          },
          statusCode
        );
      }

      monitorError(error, {
        type: "SERVER_ERROR",
        route: request?.nextUrl?.pathname,
        method: request?.method,
        code: error?.code ?? "UNKNOWN",
      });

      return jsonError(
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
          details: null,
        },
        statusCode
      );
    } finally {
      const duration = performance.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;
      trackApiExecution(
        request?.nextUrl?.pathname || "unknown",
        request.method,
        duration,
        statusCode,
        memoryDelta
      );
    }
  };
}
