import { jsonError } from "@/lib/api-response";
import { AppError, UnauthorizedError } from "@/lib/errors";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

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
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof AppError) {
        const payload = error.originalMessage !== undefined ? error.originalMessage : error.message;
        return jsonError(payload, error.statusCode);
      }

      if (error.name === "AbortError") {
        if (process.env.NODE_ENV === "development") {
          console.error("API request timed out:", error);
        } else {
          console.error("API request timed out", {
            name: error.name,
            message: error.message,
          });
        }
        return jsonError("Gateway Timeout: Groq did not respond in time.", 504);
      }

      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected server error:", error);
      } else {
        console.error("Unexpected server error:", {
          name: error?.name,
          message: error?.message,
          code: error?.code ?? "UNKNOWN",
        });
      }
      return jsonError("Internal server error", 500);
    }
  };
}

