/**
 * API Logger Utility
 * Centralized logging for API routes with structured context
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { devLog } from './logger';
import { withOptional } from './objects';

export type ApiLogContext = {
  route: string;
  method: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export class ApiLogger {
  private route: string;
  private method: string;
  private startTime: number;

  constructor(route: string, method: string) {
    this.route = route;
    this.method = method;
    this.startTime = Date.now();
  }

  private createContext(additionalContext: Partial<ApiLogContext> = {}): ApiLogContext {
    return withOptional({
      route: this.route,
      method: this.method,
      duration: Date.now() - this.startTime,
    }, additionalContext);
  }

  info(message: string, metadata?: Record<string, any>) {
    devLog(`[${this.method} ${this.route}] ${message}`, {
      ...this.createContext({ metadata }),
      level: 'info'
    });
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    devLog(`[${this.method} ${this.route}] ${message}`, {
      ...this.createContext({ error, metadata }),
      level: 'error'
    });
  }

  warn(message: string, metadata?: Record<string, any>) {
    devLog(`[${this.method} ${this.route}] ${message}`, {
      ...this.createContext({ metadata }),
      level: 'warn'
    });
  }

  debug(message: string, metadata?: Record<string, any>) {
    devLog(`[${this.method} ${this.route}] ${message}`, {
      ...this.createContext({ metadata }),
      level: 'debug'
    });
  }

  success(message: string, statusCode: number = 200, metadata?: Record<string, any>) {
    devLog(`[${this.method} ${this.route}] ${message}`, {
      ...this.createContext({ statusCode, metadata }),
      level: 'success'
    });
  }
}

// Factory function for creating API loggers
export function createApiLogger(route: string, method: string): ApiLogger {
  return new ApiLogger(route, method);
}

// Utility function for one-off logging
export function logApiEvent(
  route: string, 
  method: string, 
  message: string, 
  level: 'info' | 'error' | 'warn' | 'debug' | 'success' = 'info',
  metadata?: Record<string, any>
) {
  const logger = new ApiLogger(route, method);
  
  switch (level) {
    case 'error':
      logger.error(message, undefined, metadata);
      break;
    case 'warn':
      logger.warn(message, metadata);
      break;
    case 'debug':
      logger.debug(message, metadata);
      break;
    case 'success':
      logger.success(message, 200, metadata);
      break;
    default:
      logger.info(message, metadata);
  }
}
