const isDevelopment = process.env.NODE_ENV !== "production";

function formatLog(level, message, meta = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
}

export const logger = {
  info(message, meta = {}) {
    console.log(JSON.stringify(formatLog("INFO", message, meta)));
  },

  warn(message, meta = {}) {
    console.warn(JSON.stringify(formatLog("WARN", message, meta)));
  },

  error(message, meta = {}) {
    console.error(JSON.stringify(formatLog("ERROR", message, meta)));
  },

  debug(message, meta = {}) {
    if (isDevelopment) {
      console.debug(JSON.stringify(formatLog("DEBUG", message, meta)));
    }
  },
};
