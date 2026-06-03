import { createHash, timingSafeEqual } from "crypto";

import { jsonError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

function digest(value) {
  return createHash("sha256").update(value).digest();
}

function timingSafeStringEqual(actual, expected) {
  return timingSafeEqual(digest(actual), digest(expected));
}

function parseBearerToken(authHeader) {
  if (typeof authHeader !== "string") {
    return null;
  }

  const match = authHeader.trim().match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const token = match[1].trim();
  return token || null;
}

export function authorizeCronRequest(
  request,
  secret = process.env.CRON_SECRET
) {
  const configuredSecret = typeof secret === "string" ? secret.trim() : "";
  if (!configuredSecret) {
    logger.error("[cronAuth] CRON_SECRET is not configured");

    return {
      authorized: false,
      response: jsonError("Internal server error", 500),
    };
  }

  const token = parseBearerToken(request.headers.get("authorization"));

  if (!token || !timingSafeStringEqual(token, configuredSecret)) {
    return {
      authorized: false,
      response: jsonError("Unauthorized", 401),
    };
  }

  return {
    authorized: true,
    response: null,
  };
}
