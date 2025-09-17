/**
 * Error handling utilities
 * 
 * This module provides error handling functions for the application.
 * It replaces the old @/shared/utils/lib/error-handler imports.
 */

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleError(error: unknown): { message: string; status: number } {
  if (error instanceof AuthenticationError) {
    return { message: error.message, status: 401 };
  }
  if (error instanceof NotFoundError) {
    return { message: error.message, status: 404 };
  }
  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }
  return { message: 'An unknown error occurred', status: 500 };
}

export function getUserMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return 'Authentication required';
  }
  if (error instanceof NotFoundError) {
    return 'Resource not found';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

export function getHttpStatus(error: unknown): number {
  if (error instanceof AuthenticationError) {
    return 401;
  }
  if (error instanceof NotFoundError) {
    return 404;
  }
  if (error instanceof Error) {
    return 500;
  }
  return 500;
}
