/**
 * Error handling utilities for consistent error management
 * Provides structured error handling and user-friendly error messages
 */

import { devLog } from './logger';

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

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded', code?: string) {
    super(ErrorType.RATE_LIMIT, message, code);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string = 'Network error occurred', code?: string) {
    super(ErrorType.NETWORK, message, code);
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string = 'Database error occurred', code?: string) {
    super(ErrorType.DATABASE, message, code);
    this.name = 'DatabaseError';
  }
}

export class InternalError extends ApplicationError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(ErrorType.INTERNAL, message, code);
    this.name = 'InternalError';
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

  // Create specific error types using the enums
  createValidationError(message: string, details?: any, code?: string): ValidationError {
    return new ValidationError(message, details, code);
  }

  createAuthenticationError(message?: string, code?: string): AuthenticationError {
    return new AuthenticationError(message, code);
  }

  createAuthorizationError(message?: string, code?: string): AuthorizationError {
    return new AuthorizationError(message, code);
  }

  createNotFoundError(resource: string, code?: string): NotFoundError {
    return new NotFoundError(resource, code);
  }

  createRateLimitError(message?: string, code?: string): RateLimitError {
    return new RateLimitError(message, code);
  }

  createNetworkError(message?: string, code?: string): NetworkError {
    return new NetworkError(message, code);
  }

  createDatabaseError(message?: string, code?: string): DatabaseError {
    return new DatabaseError(message, code);
  }

  createInternalError(message?: string, code?: string): InternalError {
    return new InternalError(message, code);
  }

  // Handle and log errors
  handleError(error: Error | ApplicationError, context?: any): AppError {
    let appError: AppError;

    if (error instanceof ApplicationError) {
      appError = {
        type: error.type,
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp,
        userId: error.userId,
        requestId: error.requestId
      };
    } else {
      appError = {
        type: ErrorType.UNKNOWN,
        message: error.message,
        timestamp: new Date(),
        details: context
      };
    }

    // Log error with proper context
    this.logError(appError, context);
    
    return appError;
  }

  // Private logging method
  private logError(error: AppError, context?: any): void {
    const logData = {
      type: error.type,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp.toISOString(),
      userId: error.userId,
      requestId: error.requestId,
      context
    };

    switch (error.type) {
      case ErrorType.VALIDATION:
        devLog('Validation Error:', logData);
        break;
      case ErrorType.AUTHENTICATION:
        devLog('Authentication Error:', logData);
        break;
      case ErrorType.AUTHORIZATION:
        devLog('Authorization Error:', logData);
        break;
      case ErrorType.NOT_FOUND:
        devLog('Not Found Error:', logData);
        break;
      case ErrorType.RATE_LIMIT:
        devLog('Rate Limit Error:', logData);
        break;
      case ErrorType.NETWORK:
        devLog('Network Error:', logData);
        break;
      case ErrorType.DATABASE:
        devLog('Database Error:', logData);
        break;
      case ErrorType.INTERNAL:
        devLog('Internal Error:', logData);
        break;
      default:
        devLog('Unknown Error:', logData);
    }
  }
}

// Convenience functions
export const errorHandler = ErrorHandler.getInstance();

export const handleError = (error: Error | ApplicationError, context?: any) => {
  return errorHandler.handleError(error, context);
};

export const getUserMessage = (error: AppError) => {
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
};

export const isRetryable = (error: AppError): boolean => {
  return [
    ErrorType.NETWORK,
    ErrorType.RATE_LIMIT,
    ErrorType.DATABASE
  ].includes(error.type);
};

export const getHttpStatus = (error: AppError): number => {
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
      const appError = handleError(error as Error, { 
        context, 
        argsCount: args.length,
        argsTypes: args.map(arg => typeof arg)
      });
      throw appError;
    }
  };
};

