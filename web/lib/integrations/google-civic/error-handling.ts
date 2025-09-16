/**
 * Google Civic Information API Error Handling
 * 
 * Comprehensive error handling for Google Civic API integration with
 * proper error classification, retry logic, and user-friendly messages.
 */

import { logger } from '@/lib/logger';
import { GoogleCivicApiError } from './client';

export interface GoogleCivicErrorDetails {
  code?: string;
  message?: string;
  status?: string;
  userMessage?: string;
  details?: Array<{
    '@type': string;
    reason: string;
    domain: string;
    metadata?: Record<string, any>;
  }>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export class GoogleCivicErrorHandler {
  private retryConfig: RetryConfig;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      ...retryConfig
    };
  }

  /**
   * Handle Google Civic API errors with proper classification
   */
  handleError(error: any, context?: Record<string, any>): GoogleCivicApiError {
    logger.error('Google Civic API error occurred', { error, context });

    // If it's already our custom error, return as-is
    if (error instanceof GoogleCivicApiError) {
      return error;
    }

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new GoogleCivicApiError(
        'Network error: Unable to connect to Google Civic API',
        503,
        { originalError: error.message, context }
      );
    }

    // Handle timeout errors
    if (error.name === 'AbortError') {
      return new GoogleCivicApiError(
        'Request timeout: Google Civic API did not respond in time',
        408,
        { context }
      );
    }

    // Handle HTTP response errors
    if (error.status || error.statusCode) {
      return this.handleHttpError(error, context);
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return new GoogleCivicApiError(
        'Invalid response: Google Civic API returned malformed JSON',
        502,
        { originalError: error.message, context }
      );
    }

    // Generic error fallback
    return new GoogleCivicApiError(
      `Unexpected error: ${error.message || 'Unknown error'}`,
      500,
      { originalError: error, context }
    );
  }

  /**
   * Handle HTTP response errors
   */
  private handleHttpError(error: any, context?: Record<string, any>): GoogleCivicApiError {
    const status = error.status || error.statusCode;
    const errorData = error.body || error.data || {};

    switch (status) {
      case 400:
        return new GoogleCivicApiError(
          'Bad request: Invalid parameters provided to Google Civic API',
          400,
          { 
            details: errorData,
            context,
            userMessage: 'The address or parameters provided are invalid. Please check your input and try again.'
          }
        );

      case 403:
        return new GoogleCivicApiError(
          'Forbidden: API key is invalid or quota exceeded',
          403,
          { 
            details: errorData,
            context,
            userMessage: 'API access denied. Please check your API key configuration.'
          }
        );

      case 404:
        return new GoogleCivicApiError(
          'Not found: No representatives found for the given address',
          404,
          { 
            details: errorData,
            context,
            userMessage: 'No representatives found for this address. The address may be invalid or outside the supported regions.'
          }
        );

      case 408:
        return new GoogleCivicApiError(
          'Request timeout: Google Civic API took too long to respond',
          408,
          { 
            details: errorData,
            context,
            userMessage: 'The request timed out. Please try again.'
          }
        );

      case 429:
        return new GoogleCivicApiError(
          'Rate limit exceeded: Too many requests to Google Civic API',
          429,
          { 
            details: errorData,
            context,
            userMessage: 'Too many requests. Please wait a moment before trying again.'
          }
        );

      case 500:
        return new GoogleCivicApiError(
          'Internal server error: Google Civic API is experiencing issues',
          500,
          { 
            details: errorData,
            context,
            userMessage: 'Google Civic API is temporarily unavailable. Please try again later.'
          }
        );

      case 502:
      case 503:
      case 504:
        return new GoogleCivicApiError(
          'Service unavailable: Google Civic API is temporarily down',
          status,
          { 
            details: errorData,
            context,
            userMessage: 'Google Civic API is temporarily unavailable. Please try again later.'
          }
        );

      default:
        return new GoogleCivicApiError(
          `HTTP error ${status}: ${errorData.message || 'Unknown error'}`,
          status,
          { 
            details: errorData,
            context,
            userMessage: 'An error occurred while fetching representative information.'
          }
        );
    }
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: GoogleCivicApiError): boolean {
    return this.retryConfig.retryableStatusCodes.includes(error.statusCode);
  }

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: GoogleCivicApiError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        logger.debug('Executing Google Civic API operation', { attempt, context });
        return await operation();
      } catch (error) {
        lastError = this.handleError(error, { ...context, attempt });
        
        // If not retryable or last attempt, throw immediately
        if (!this.isRetryableError(lastError) || attempt === this.retryConfig.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );

        logger.warn('Google Civic API operation failed, retrying', {
          attempt,
          delay,
          error: lastError.message,
          context
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: GoogleCivicApiError): string {
    const userMessage = (error.details as GoogleCivicErrorDetails)?.userMessage;
    if (userMessage) {
      return userMessage;
    }

    // Fallback messages based on status code
    switch (error.statusCode) {
      case 400:
        return 'Invalid address or parameters provided. Please check your input and try again.';
      case 403:
        return 'API access denied. Please contact support if this issue persists.';
      case 404:
        return 'No representatives found for this address. Please verify the address is correct.';
      case 408:
        return 'Request timed out. Please try again.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'An error occurred while fetching representative information. Please try again.';
    }
  }

  /**
   * Log error with appropriate level
   */
  logError(error: GoogleCivicApiError, context?: Record<string, any>): void {
    const logData = {
      error: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      details: error.details,
      context
    };

    if (error.statusCode >= 500) {
      logger.error('Google Civic API server error', logData);
    } else if (error.statusCode >= 400) {
      logger.warn('Google Civic API client error', logData);
    } else {
      logger.info('Google Civic API error', logData);
    }
  }

  /**
   * Create error metrics for monitoring
   */
  createErrorMetrics(error: GoogleCivicApiError): Record<string, any> {
    return {
      errorType: 'google_civic_api_error',
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      timestamp: error.timestamp,
      retryable: this.isRetryableError(error),
      userFriendly: this.getUserFriendlyMessage(error)
    };
  }
}

/**
 * Default error handler instance
 */
export const googleCivicErrorHandler = new GoogleCivicErrorHandler();

/**
 * Utility function to handle Google Civic API errors
 */
export function handleGoogleCivicError(error: any, context?: Record<string, any>): GoogleCivicApiError {
  return googleCivicErrorHandler.handleError(error, context);
}

/**
 * Utility function to execute operations with retry
 */
export function executeWithRetry<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return googleCivicErrorHandler.executeWithRetry(operation, context);
}
