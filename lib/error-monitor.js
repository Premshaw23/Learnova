import { logger } from "./logger";

export function monitorError(error, context = {}) {
  logger.error(error.message || "Unknown error", {
    stack: error.stack,
    ...context,
  });
}