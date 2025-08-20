/**
 * Error handling utilities for consistent error management
 * Provides structured error handling and user-friendly error messages
 */

import { logger } from './logger';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}

export class ApplicationError extends Error {
  public type: ErrorType;
  public code?: string;
  public details?: any;
  public timestamp: Date;
  public userId?: string;
  public requestId?: string;

  constructor(
    type: ErrorType,
    message: string,
    code?: string,
    details?: any,
    userId?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.userId = userId;
    this.requestId = requestId;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any, code?: string) {
    super(ErrorType.VALIDATION, message, code, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', code?: string) {
    super(ErrorType.AUTHENTICATION, message, code);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', code?: string) {
    super(ErrorType.AUTHORIZATION, message, code);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, code?: string) {
    super(ErrorType.NOT_FOUND, `${resource} not found`, code);
    this.name = 'NotFoundError';
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle and log errors
  handleError(error: Error | ApplicationError, context?: any): AppError {
    let appError: AppError;

    if (error instanceof ApplicationError) {
      appError = {
        type: error.type,
        message: error instanceof Error ? error.message : "Unknown error",
        code: error.code,
        details: error.details,
        timestamp: error.timestamp,
        userId: error.userId,
        requestId: error.requestId
      };
    } else {
      appError = {
        type: ErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : "Unknown error" || 'An unexpected error occurred',
        timestamp: new Date(),
        details: {
          originalError: error.name,
          stack: error.stack
        }
      };
    }

    // Log the error
    logger.error(appError.message, error, {
      type: appError.type,
      code: appError.code,
      context
    });

    return appError;
  }

  // Convert to user-friendly message
  getUserMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please try again later.';
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorType.DATABASE:
        return 'Database error. Please try again later.';
      case ErrorType.INTERNAL:
        return 'An internal error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Check if error is retryable
  isRetryable(error: AppError): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.RATE_LIMIT,
      ErrorType.DATABASE
    ].includes(error.type);
  }

  // Get HTTP status code for error
  getHttpStatus(error: AppError): number {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return 400;
      case ErrorType.AUTHENTICATION:
        return 401;
      case ErrorType.AUTHORIZATION:
        return 403;
      case ErrorType.NOT_FOUND:
        return 404;
      case ErrorType.RATE_LIMIT:
        return 429;
      case ErrorType.NETWORK:
        return 503;
      case ErrorType.DATABASE:
        return 500;
      case ErrorType.INTERNAL:
        return 500;
      default:
        return 500;
    }
  }
}

// Convenience functions
export const errorHandler = ErrorHandler.getInstance();

export const handleError = (error: Error | ApplicationError, context?: any) => {
  return errorHandler.handleError(error, context);
};

export const getUserMessage = (error: AppError) => {
  return errorHandler.getUserMessage(error);
};

export const isRetryable = (error: AppError) => {
  return errorHandler.isRetryable(error);
};

export const getHttpStatus = (error: AppError) => {
  return errorHandler.getHttpStatus(error);
};

// Async error wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error as Error, { context, args });
      throw appError;
    }
  };
};
