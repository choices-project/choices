/**
 * Error Handler Module
 * 
 * Comprehensive error handling for API routes and server actions.
 * Provides standardized error types, handling, and user-friendly messages.
 * 
 * Features:
 * - Custom error classes
 * - Error logging and monitoring
 * - User-friendly error messages
 * - HTTP status code mapping
 * - Error recovery strategies
 * 
 * @author Choices Platform Team
 * @created 2025-10-26
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from '@/lib/utils/logger';

export type ErrorDetails = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  stack?: string;
}

export type UserErrorResponse = {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, details);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, details);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND_ERROR', 404, true, details);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', 409, true, details);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, details);
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, true, details);
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', details?: Record<string, unknown>) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true, details);
  }
}

/**
 * Handle error and return appropriate response
 */
export function handleError(error: unknown): {
  statusCode: number;
  response: UserErrorResponse;
  logLevel: 'error' | 'warn' | 'info';
} {
  let appError: AppError;
  let logLevel: 'error' | 'warn' | 'info' = 'error';

  if (error instanceof AppError) {
    appError = error;
    logLevel = appError.isOperational ? 'warn' : 'error';
  } else if (error instanceof Error) {
    appError = new AppError(
      'An unexpected error occurred',
      'UNEXPECTED_ERROR',
      500,
      false,
      { originalError: error.message }
    );
  } else {
    appError = new AppError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      false,
      { originalError: String(error) }
    );
  }

  const response: UserErrorResponse = {
    error: appError.message,
    message: getUserMessage(appError),
    code: appError.code,
    timestamp: new Date().toISOString()
  };

  // Log the error
  const logData = {
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    isOperational: appError.isOperational,
    details: appError.details,
    stack: appError.stack
  };

  if (logLevel === 'error') {
    logger.error('Application error occurred', logData);
  } else if (logLevel === 'warn') {
    logger.warn('Operational error occurred', logData);
  } else {
    logger.info('Error handled', logData);
  }

  return {
    statusCode: appError.statusCode,
    response,
    logLevel
  };
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: AppError): string {
  const userMessages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your input and try again',
    AUTHENTICATION_ERROR: 'Please log in to continue',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action',
    NOT_FOUND_ERROR: 'The requested resource was not found',
    CONFLICT_ERROR: 'This action conflicts with existing data',
    RATE_LIMIT_ERROR: 'Too many requests. Please try again later',
    DATABASE_ERROR: 'A temporary error occurred. Please try again',
    EXTERNAL_SERVICE_ERROR: 'A service is temporarily unavailable',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again'
  };

  return userMessages[error.code] || 'An error occurred. Please try again';
}

/**
 * Get HTTP status code for error
 */
export function getHttpStatus(error: AppError): number {
  return error.statusCode;
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError && error.isOperational;
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(error: unknown): Response {
  const { statusCode, response } = handleError(error);
  
  return new Response(
    JSON.stringify(response),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

/**
 * Create error response for server actions
 */
export function createServerActionError(error: unknown): {
  success: false;
  error: string;
  message: string;
  code?: string;
  timestamp: string;
} {
  const { response } = handleError(error);
  
  return {
    success: false,
    error: response.error,
    message: response.message,
    code: response.code,
    timestamp: response.timestamp
  };
}

/**
 * Error recovery strategies
 */
export const errorRecovery = {
  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn(`Operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    throw lastError;
  },

  /**
   * Fallback to default value on error
   */
  async withFallback<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      logger.warn('Operation failed, using fallback', {
        error: error instanceof Error ? error.message : String(error)
      });
      return fallback;
    }
  },

  /**
   * Circuit breaker pattern
   */
  createCircuitBreaker(
    failureThreshold: number = 5,
    timeout: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    return async <T>(operation: () => Promise<T>): Promise<T> => {
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > timeout) {
          state = 'HALF_OPEN';
        } else {
          throw new AppError('Circuit breaker is open', 'CIRCUIT_BREAKER_OPEN', 503);
        }
      }

      try {
        const result = await operation();
        
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();
        
        if (failures >= failureThreshold) {
          state = 'OPEN';
        }
        
        throw error;
      }
    };
  }
};

export default {
  handleError,
  getUserMessage,
  getHttpStatus,
  isOperationalError,
  createErrorResponse,
  createServerActionError,
  errorRecovery
};