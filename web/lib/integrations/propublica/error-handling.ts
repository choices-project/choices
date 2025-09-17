/**
 * ProPublica Congress API Error Handling
 * 
 * Comprehensive error handling for ProPublica API integration with
 * proper error classification, retry logic, and user-friendly messages.
 */

import { logger } from '@/lib/logger';
import { ProPublicaApiError } from './client';

export interface ProPublicaErrorDetails {
  message?: string;
  status?: string;
  userMessage?: string;
  errors?: Array<{
    message: string;
    field?: string;
  }>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export class ProPublicaErrorHandler {
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
   * Handle ProPublica API errors with proper classification
   */
  handleError(error: any, context?: Record<string, any>): ProPublicaApiError {
    logger.error('ProPublica API error occurred', { error, context });

    // If it's already our custom error, return as-is
    if (error instanceof ProPublicaApiError) {
      return error;
    }

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new ProPublicaApiError(
        'Network error: Unable to connect to ProPublica API',
        503,
        { originalError: error.message, context }
      );
    }

    // Handle timeout errors
    if (error.name === 'AbortError') {
      return new ProPublicaApiError(
        'Request timeout: ProPublica API did not respond in time',
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
      return new ProPublicaApiError(
        'Invalid response: ProPublica API returned malformed JSON',
        502,
        { originalError: error.message, context }
      );
    }

    // Generic error fallback
    return new ProPublicaApiError(
      `Unexpected error: ${error.message || 'Unknown error'}`,
      500,
      { originalError: error, context }
    );
  }

  /**
   * Handle HTTP response errors
   */
  private handleHttpError(error: any, context?: Record<string, any>): ProPublicaApiError {
    const status = error.status || error.statusCode;
    const errorData = error.body || error.data || {};

    switch (status) {
      case 400:
        return new ProPublicaApiError(
          'Bad request: Invalid parameters provided to ProPublica API',
          400,
          { 
            details: errorData,
            context,
            userMessage: 'The request parameters are invalid. Please check your input and try again.'
          }
        );

      case 401:
        return new ProPublicaApiError(
          'Unauthorized: API key is invalid or missing',
          401,
          { 
            details: errorData,
            context,
            userMessage: 'API authentication failed. Please check your API key configuration.'
          }
        );

      case 403:
        return new ProPublicaApiError(
          'Forbidden: API key is invalid or quota exceeded',
          403,
          { 
            details: errorData,
            context,
            userMessage: 'API access denied. Please check your API key configuration.'
          }
        );

      case 404:
        return new ProPublicaApiError(
          'Not found: Requested resource not found in ProPublica API',
          404,
          { 
            details: errorData,
            context,
            userMessage: 'The requested information was not found. Please verify the parameters and try again.'
          }
        );

      case 408:
        return new ProPublicaApiError(
          'Request timeout: ProPublica API took too long to respond',
          408,
          { 
            details: errorData,
            context,
            userMessage: 'The request timed out. Please try again.'
          }
        );

      case 429:
        return new ProPublicaApiError(
          'Rate limit exceeded: Too many requests to ProPublica API',
          429,
          { 
            details: errorData,
            context,
            userMessage: 'Too many requests. Please wait a moment before trying again.'
          }
        );

      case 500:
        return new ProPublicaApiError(
          'Internal server error: ProPublica API is experiencing issues',
          500,
          { 
            details: errorData,
            context,
            userMessage: 'ProPublica API is temporarily unavailable. Please try again later.'
          }
        );

      case 502:
      case 503:
      case 504:
        return new ProPublicaApiError(
          'Service unavailable: ProPublica API is temporarily down',
          status,
          { 
            details: errorData,
            context,
            userMessage: 'ProPublica API is temporarily unavailable. Please try again later.'
          }
        );

      default:
        return new ProPublicaApiError(
          `HTTP error ${status}: ${errorData.message || 'Unknown error'}`,
          status,
          { 
            details: errorData,
            context,
            userMessage: 'An error occurred while fetching congressional information.'
          }
        );
    }
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: ProPublicaApiError): boolean {
    return this.retryConfig.retryableStatusCodes.includes(error.statusCode);
  }

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: ProPublicaApiError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        logger.debug('Executing ProPublica API operation', { attempt, context });
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

        logger.warn('ProPublica API operation failed, retrying', {
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
  getUserFriendlyMessage(error: ProPublicaApiError): string {
    const userMessage = (error.details as ProPublicaErrorDetails)?.userMessage;
    if (userMessage) {
      return userMessage;
    }

    // Fallback messages based on status code
    switch (error.statusCode) {
      case 400:
        return 'Invalid request parameters. Please check your input and try again.';
      case 401:
      case 403:
        return 'API access denied. Please contact support if this issue persists.';
      case 404:
        return 'The requested information was not found. Please verify the parameters and try again.';
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
        return 'An error occurred while fetching congressional information. Please try again.';
    }
  }

  /**
   * Log error with appropriate level
   */
  logError(error: ProPublicaApiError, context?: Record<string, any>): void {
    const logData = {
      error: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      details: error.details,
      context
    };

    if (error.statusCode >= 500) {
      logger.error('ProPublica API server error', logData);
    } else if (error.statusCode >= 400) {
      logger.warn('ProPublica API client error', logData);
    } else {
      logger.info('ProPublica API error', logData);
    }
  }

  /**
   * Create error metrics for monitoring
   */
  createErrorMetrics(error: ProPublicaApiError): Record<string, any> {
    return {
      errorType: 'propublica_api_error',
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
export const proPublicaErrorHandler = new ProPublicaErrorHandler();

/**
 * Utility function to handle ProPublica API errors
 */
export function handleProPublicaError(error: any, context?: Record<string, any>): ProPublicaApiError {
  return proPublicaErrorHandler.handleError(error, context);
}

/**
 * Utility function to execute operations with retry
 */
export function executeWithRetry<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return proPublicaErrorHandler.executeWithRetry(operation, context);
}
