// Central error handling utilities
// Created: 2025-01-16
// Purpose: User-friendly error message handling

import { ApplicationError } from './base';

/**
 * Convert any error to a user-friendly message
 */
export const userMessage = (e: unknown): string => {
  if (e instanceof ApplicationError) {
    return e.message;
  }
  if (typeof e === 'string') {
    return e;
  }
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
};

/**
 * Get HTTP status code from error
 */
export const getHttpStatus = (e: unknown): number => {
  if (e instanceof ApplicationError) {
    return e.statusCode;
  }
  if (e && typeof e === 'object' && 'status' in e) {
    const status = (e as { status: unknown }).status;
    return typeof status === 'number' ? status : 500;
  }
  return 500;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (e: unknown): boolean => {
  if (e instanceof ApplicationError) {
    return e.statusCode >= 500 || e.statusCode === 429;
  }
  if (e && typeof e === 'object' && 'code' in e) {
    const code = (e as { code: unknown }).code;
    return typeof code === 'string' && (
      code.includes('NETWORK') || 
      code.includes('TIMEOUT') || 
      code.includes('HTTP_5') ||
      code.includes('HTTP_429')
    );
  }
  return false;
};


