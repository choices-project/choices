/**
 * Core Error Classes and Utilities
 *
 * This module provides standardized error classes for consistent error handling
 * across the application. All errors extend the base ApplicationError class
 * and include proper HTTP status codes and error codes.
 *
 * @fileoverview Central error handling module
 */

export { ApplicationError } from './base';
export { AuthenticationError } from './authentication';
export { ValidationError } from './validation';
export { NotFoundError } from './not-found';
export { ForbiddenError } from './forbidden';
export { ConflictError } from './conflict';
export { InternalServerError } from './internal-server';
export { NotImplementedError } from './not-implemented';

// Re-export all error types for convenience
export type {
  ErrorResponse,
  ErrorDetails,
  ErrorContext
} from './types';
