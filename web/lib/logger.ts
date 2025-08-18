/**
 * Logger utility for development and production environments
 * Provides structured logging with environment-aware output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: error?.message,
        stack: error?.stack
      };
      console.error(this.formatMessage('ERROR', message, errorContext));
    }
  }

  // API-specific logging
  apiCall(endpoint: string, method: string, status?: number, duration?: number): void {
    this.info('API Call', {
      endpoint,
      method,
      status,
      duration: duration ? `${duration}ms` : undefined
    });
  }

  // Database-specific logging
  dbQuery(operation: string, table: string, duration?: number): void {
    this.debug('Database Query', {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined
    });
  }

  // User action logging
  userAction(action: string, userId?: string, context?: LogContext): void {
    this.info('User Action', {
      action,
      userId,
      ...context
    });
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info('Performance', {
      operation,
      duration: `${duration}ms`,
      ...context
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions for common use cases
export const logApiCall = (endpoint: string, method: string, status?: number, duration?: number) => {
  logger.apiCall(endpoint, method, status, duration);
};

export const logDbQuery = (operation: string, table: string, duration?: number) => {
  logger.dbQuery(operation, table, duration);
};

export const logUserAction = (action: string, userId?: string, context?: LogContext) => {
  logger.userAction(action, userId, context);
};

export const logPerformance = (operation: string, duration: number, context?: LogContext) => {
  logger.performance(operation, duration, context);
};

// Development-only logging (replaces console.log)
export const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] ${message}`, ...args);
  }
};
