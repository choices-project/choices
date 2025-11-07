/**
 * API Logger Utility
 * Centralized logging for API routes with structured context
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { withOptional } from '@/lib/util/objects';

import { devLog } from './logger';

export type ApiLogContext = {
  route: string;
  method: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  metadata?: Record<string, unknown>;
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

  private createContext(additionalContext?: Partial<ApiLogContext>): ApiLogContext {
    const base: ApiLogContext = {
      route: this.route,
      method: this.method,
      duration: Date.now() - this.startTime
    };

    if (!additionalContext) {
      return base;
    }

    return withOptional(base as Record<string, unknown>, additionalContext as Record<string, unknown>) as ApiLogContext;
  }

  info(message: string, metadata?: Record<string, any>) {
    const context = this.createContext({ metadata: metadata ?? {} });
    const payload = withOptional(context as Record<string, unknown>, { level: 'info' });
    devLog(`[${this.method} ${this.route}] ${message}`, payload);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    const metadataContext = withOptional(
      { metadata: metadata ?? {} } as Record<string, unknown>,
      error ? { error } : undefined
    ) as Partial<ApiLogContext>;
    const context = this.createContext(metadataContext);
    const payload = withOptional(context as Record<string, unknown>, { level: 'error' });
    devLog(`[${this.method} ${this.route}] ${message}`, payload);
  }

  warn(message: string, metadata?: Record<string, any>) {
    const context = this.createContext({ metadata: metadata ?? {} });
    const payload = withOptional(context as Record<string, unknown>, { level: 'warn' });
    devLog(`[${this.method} ${this.route}] ${message}`, payload);
  }

  debug(message: string, metadata?: Record<string, any>) {
    const context = this.createContext({ metadata: metadata ?? {} });
    const payload = withOptional(context as Record<string, unknown>, { level: 'debug' });
    devLog(`[${this.method} ${this.route}] ${message}`, payload);
  }

  success(message: string, statusCode = 200, metadata?: Record<string, any>) {
    const context = this.createContext({ statusCode, metadata: metadata ?? {} });
    const payload = withOptional(context as Record<string, unknown>, { level: 'success' });
    devLog(`[${this.method} ${this.route}] ${message}`, payload);
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
