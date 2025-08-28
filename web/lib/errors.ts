/**
 * Error handling utilities for TypeScript strict mode
 * Centralizes error type conversion for logger compatibility
 */

export function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(typeof e === 'string' ? e : JSON.stringify(e));
}

export function getErrorMessage(e: unknown): string {
  return (e instanceof Error && e.message) ? e.message : String(e);
}

/**
 * Safe error logging utility that handles unknown types
 */
export function logError(message: string, error: unknown): void {
  const err = toError(error);
  // Import logger dynamically to avoid circular dependencies
  const { logger } = require('./logger');
  logger.error(message, err);
}
