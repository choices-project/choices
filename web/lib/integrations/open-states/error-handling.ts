/**
 * Open States API Error Handling
 * 
 * Comprehensive error handling for Open States API integration
 */

import { dev } from '../../dev.logger';

// Error types
export type ErrorDetails = {
  code?: string;
  message: string;
  details?: any;
  userMessage?: string;
  retryable?: boolean;
  statusCode?: number;
}

export type RetryConfig = {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

// Open States specific error classes
export class OpenStatesApiError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly details?: any;

  constructor(message: string, code: string = 'OPEN_STATES_ERROR', statusCode?: number, retryable: boolean = false, details?: any) {
    super(message);
    this.name = 'OpenStatesApiError';
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    
    // Use withOptional to handle optional statusCode property
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
  }
}

export class OpenStatesRateLimitError extends OpenStatesApiError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, { retryAfter });
    this.name = 'OpenStatesRateLimitError';
  }
}

export class OpenStatesNotFoundError extends OpenStatesApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404, false);
    this.name = 'OpenStatesNotFoundError';
  }
}

export class OpenStatesAuthenticationError extends OpenStatesApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401, false);
    this.name = 'OpenStatesAuthenticationError';
  }
}

export class OpenStatesQuotaExceededError extends OpenStatesApiError {
  constructor(message: string = 'API quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', 429, true);
    this.name = 'OpenStatesQuotaExceededError';
  }
}

export class OpenStatesServerError extends OpenStatesApiError {
  constructor(message: string = 'Internal server error', statusCode: number = 500) {
    super(message, 'SERVER_ERROR', statusCode, true);
    this.name = 'OpenStatesServerError';
  }
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  retryableErrors: ['RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED', 'SERVER_ERROR', 'NETWORK_ERROR']
};

// Error classification
export function classifyError(error: any): OpenStatesApiError {
  dev.logger.debug('Classifying Open States API error', { error });

  // If it's already an OpenStatesApiError, return it
  if (error instanceof OpenStatesApiError) {
    return error;
  }

  // Handle HTTP errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || data?.error || `HTTP ${status} error`;

    switch (status) {
      case 401:
        return new OpenStatesAuthenticationError(message);
      case 404:
        return new OpenStatesNotFoundError(message);
      case 429:
        return new OpenStatesRateLimitError(message, data?.retry_after);
      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenStatesServerError(message, status);
      default:
        return new OpenStatesApiError(message, 'HTTP_ERROR', status, status >= 500);
    }
  }

  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return new OpenStatesApiError(
      `Network error: ${error.message}`,
      'NETWORK_ERROR',
      undefined,
      true,
      { originalError: error.code }
    );
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return new OpenStatesApiError(
      'Request timeout',
      'TIMEOUT_ERROR',
      undefined,
      true
    );
  }

  // Handle generic errors
  return new OpenStatesApiError(
    error.message || 'Unknown error occurred',
    'UNKNOWN_ERROR',
    undefined,
    false,
    { originalError: error }
  );
}

// Error formatting
export function formatErrorForUser(error: OpenStatesApiError): string {
  const userMessage = error.details?.userMessage;
  
  if (userMessage) {
    return userMessage;
  }

  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please try again later.';
    case 'QUOTA_EXCEEDED':
      return 'API quota exceeded. Please try again later.';
    case 'NOT_FOUND':
      return 'The requested information could not be found.';
    case 'AUTHENTICATION_ERROR':
      return 'Authentication failed. Please check your API key.';
    case 'SERVER_ERROR':
      return 'Server error occurred. Please try again later.';
    case 'NETWORK_ERROR':
      return 'Network error occurred. Please check your connection.';
    case 'TIMEOUT_ERROR':
      return 'Request timed out. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Retry logic
export function shouldRetry(error: OpenStatesApiError, attempt: number, config: RetryConfig): boolean {
  if (attempt >= config.maxRetries) {
    return false;
  }

  if (!error.retryable) {
    return false;
  }

  if (config.retryableStatusCodes.includes(error.statusCode || 0)) {
    return true;
  }

  if (config.retryableErrors.includes(error.code)) {
    return true;
  }

  return false;
}

export function calculateRetryDelay(attempt: number, config: RetryConfig, baseDelay?: number): number {
  const delay = baseDelay || config.baseDelay;
  const exponentialDelay = delay * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

// Execute with retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: string = 'Open States API'
): Promise<T> {
  let lastError: OpenStatesApiError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      dev.logger.debug(`Executing ${context} operation`, { attempt: attempt + 1 });
      
      const result = await operation();
      
      if (attempt > 0) {
        dev.logger.info(`${context} operation succeeded after retry`, { 
          attempts: attempt + 1 
        });
      }
      
      return result;
      
    } catch (error) {
      const classifiedError = classifyError(error);
      lastError = classifiedError;
      
      dev.logger.warn(`${context} operation failed`, {
        attempt: attempt + 1,
        error: classifiedError.message,
        code: classifiedError.code,
        retryable: classifiedError.retryable
      });
      
      if (!shouldRetry(classifiedError, attempt, config)) {
        break;
      }
      
      if (attempt < config.maxRetries) {
        const delay = calculateRetryDelay(attempt, config);
        dev.logger.debug(`Retrying ${context} operation after delay`, { 
          delay,
          nextAttempt: attempt + 2 
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  dev.logger.error(`${context} operation failed after all retries`, {
    attempts: config.maxRetries + 1,
    finalError: lastError!.message,
    code: lastError!.code
  });
  
  throw lastError!;
}

// Error monitoring
export type ErrorMetrics = {
  totalErrors: number;
  errorsByCode: Record<string, number>;
  errorsByStatusCode: Record<number, number>;
  retryableErrors: number;
  nonRetryableErrors: number;
  averageRetries: number;
}

export class ErrorMonitor {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCode: {},
    errorsByStatusCode: {},
    retryableErrors: 0,
    nonRetryableErrors: 0,
    averageRetries: 0
  };
  
  private retryCounts: number[] = [];

  recordError(error: OpenStatesApiError, retries: number = 0): void {
    this.metrics.totalErrors++;
    this.metrics.errorsByCode[error.code] = (this.metrics.errorsByCode[error.code] || 0) + 1;
    
    if (error.statusCode) {
      this.metrics.errorsByStatusCode[error.statusCode] = (this.metrics.errorsByStatusCode[error.statusCode] || 0) + 1;
    }
    
    if (error.retryable) {
      this.metrics.retryableErrors++;
    } else {
      this.metrics.nonRetryableErrors++;
    }
    
    this.retryCounts.push(retries);
    this.metrics.averageRetries = this.retryCounts.reduce((sum, count) => sum + count, 0) / this.retryCounts.length;
    
    dev.logger.debug('Recorded Open States API error', {
      code: error.code,
      retries,
      totalErrors: this.metrics.totalErrors
    });
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByCode: {},
      errorsByStatusCode: {},
      retryableErrors: 0,
      nonRetryableErrors: 0,
      averageRetries: 0
    };
    this.retryCounts = [];
  }
}

// Global error monitor instance
export const openStatesErrorMonitor = new ErrorMonitor();
