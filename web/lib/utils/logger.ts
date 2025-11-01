/**
 * Logger Utility
 * 
 * Simple logging utility for the application
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
      
      // Send to Sentry if available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        try {
          const error = args[0] instanceof Error ? args[0] : new Error(message);
          (window as any).Sentry.captureException(error, {
            extra: { message, args: args.length > 1 ? args.slice(1) : [] }
          });
        } catch {
          // Ignore Sentry errors
        }
      }
    }
  }
}

export const logger = new Logger();

export default logger;

// Additional exports for compatibility
export const devLog = (message: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, ...args);
  }
};

export const logError = (message: string, error?: Error, ...args: unknown[]) => {
  logger.error(message, error, ...args);
};