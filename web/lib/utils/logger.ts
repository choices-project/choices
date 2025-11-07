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

  private emit(method: 'warn' | 'error', levelLabel: string, message: string, args: unknown[]): void {
    if (method === 'warn') {
      console.warn(`[${levelLabel}] ${message}`, ...args);
    } else {
      console.error(`[${levelLabel}] ${message}`, ...args);
    }
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      this.emit('warn', 'DEBUG', message, args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      this.emit('warn', 'INFO', message, args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      this.emit('warn', 'WARN', message, args);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      this.emit('error', 'ERROR', message, args);
      
      // Send to Sentry if available
      if (typeof window !== 'undefined') {
        const sentryWindow = window as typeof window & {
          Sentry?: {
            captureException: (error: Error, options?: { extra?: Record<string, unknown> }) => void;
          };
        };
        if (sentryWindow.Sentry) {
          try {
            const error = args[0] instanceof Error ? args[0] : new Error(message);
            sentryWindow.Sentry.captureException(error, {
              extra: { message, args: args.length > 1 ? args.slice(1) : [] }
            });
          } catch {
            // Ignore Sentry errors
          }
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