import logger from "@/utils/logger";

export function monitorError(error, context = {}) {
  const metadata = error.metadata || {};
  logger.error("TELEMETRY_ERROR_CAPTURE", {
    message: error.message || "Unknown error",
    name: error.name || "Error",
    stack: error.stack,
    ...context,
    metadata,
  });
}

export function trackApiExecution(
  route,
  method,
  duration,
  statusCode,
  memoryDelta
) {
  logger.info("API_EXECUTION_TELEMETRY", {
    route,
    method,
    durationMs: duration,
    statusCode,
    memoryDeltaBytes: memoryDelta,
  });
}
