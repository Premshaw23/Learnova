import { jsonError } from "@/lib/api-response";
import { fail } from "@/lib/apiResponse";
import { AppError, ValidationError, UnauthorizedError } from "@/lib/errors";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { monitorError } from "./error-monitor";
import { logger } from "./logger";

/**
 * Reads the request body as text, validates its byte size before
 * parsing JSON.  Prevents memory exhaustion from oversized payloads.
 *
 * @param {Request} request
 * @param {number} maxBytes - Maximum allowed payload size in bytes.
 * @returns {Promise<Object>} Parsed JSON body.
 */
export async function parseJSON(request, maxBytes = 1024 * 100) {
  const raw = await request.text();
  const bytes = new TextEncoder().encode(raw).length;
  if (bytes > maxBytes) {
    throw new AppError(`Payload too large (${bytes} bytes, limit ${maxBytes})`, 413);
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
  if (typeof authResult === "object") {
    if ("valid" in authResult) {
      if (!authResult.valid) {
        throw new UnauthorizedError("Unauthorized");
      }
      return authResult.decodedToken;
    }
    // Directly mock returned object, e.g., { uid, email }
    if (authResult.uid) {
      return authResult;
    }
  }

  throw new UnauthorizedError("Unauthorized");
}

export function withErrorHandler(handler) {
  return async function (request, ...args) {
    try {
      logger.info("Incoming API request", {
        method: request.method,
        route: request.nextUrl?.pathname,
      });

      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof AppError) {
        const payload = error.originalMessage !== undefined ? error.originalMessage : error.message;
        let message = error.message;
        let code = `HTTP_${error.statusCode}`;
        let details = null;

        if (typeof payload === "object" && payload !== null) {
          message = payload.message || message;
          code = payload.code || code;
          details = payload.details || null;
        } else if (typeof payload === "string") {
          message = payload;
        }

        return fail(error.statusCode, code, message, details);
      }

      if (error.name === "AbortError") {
        monitorError(error, {
          type: "TIMEOUT_ERROR",
          route: request?.nextUrl?.pathname,
          method: request?.method,
        });

        return fail(
          504,
          "GATEWAY_TIMEOUT",
          "Gateway Timeout: Groq did not respond in time."
        );
      }

      monitorError(error, {
        type: "SERVER_ERROR",
        route: request?.nextUrl?.pathname,
        method: request?.method,
        code: error?.code ?? "UNKNOWN",
      });

      logger.error("Unhandled server error", {
        name: error?.name,
        message: error?.message,
      });
      return fail(500, "INTERNAL_SERVER_ERROR", "Internal server error");
    }
  };
}

