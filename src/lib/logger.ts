// A simple logger module to standardize logging across the application

type LogLevel = "info" | "warn" | "error" | "debug";

const logger = {
  info: (...args: unknown[]) => {
    console.info("[INFO]", ...args);
  },

  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },

  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },

  debug: (...args: unknown[]) => {
    // Only log debug in development
    if (process.env.NODE_ENV === "development") {
      console.debug("[DEBUG]", ...args);
    }
  },

  // Log with a specific level
  log: (level: LogLevel, ...args: unknown[]) => {
    switch (level) {
      case "info":
        logger.info(...args);
        break;
      case "warn":
        logger.warn(...args);
        break;
      case "error":
        logger.error(...args);
        break;
      case "debug":
        logger.debug(...args);
        break;
    }
  },
};

export default logger;
