/**
 * Congress.gov API Error Handling
 * 
 * Specialized error handling for Congress.gov API responses
 */

export class CongressGovApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiResponse?: unknown
  ) {
    super(message);
    this.name = 'CongressGovApiError';
  }
}

export class CongressGovRateLimitError extends CongressGovApiError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'CongressGovRateLimitError';
  }
}

export class CongressGovNotFoundError extends CongressGovApiError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 404);
    this.name = 'CongressGovNotFoundError';
  }
}

export class CongressGovAuthenticationError extends CongressGovApiError {
  constructor(message: string = 'Invalid API key or authentication failed') {
    super(message, 401);
    this.name = 'CongressGovAuthenticationError';
  }
}

export class CongressGovQuotaExceededError extends CongressGovApiError {
  constructor(message: string = 'Daily quota exceeded') {
    super(message, 429);
    this.name = 'CongressGovQuotaExceededError';
  }
}

/**
 * Handle Congress.gov API errors
 */
export function handleCongressGovError(error: unknown): never {
  if (error instanceof CongressGovApiError) {
    throw error;
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response: { status: number; data: unknown; headers?: Record<string, string> } }).response;
    const { status, data } = response;
    
    switch (status) {
      case 401:
        throw new CongressGovAuthenticationError();
      case 404:
        throw new CongressGovNotFoundError('Resource', 'Unknown');
      case 429: {
        const retryAfter = response.headers?.['retry-after'];
        throw new CongressGovRateLimitError(
          'Rate limit exceeded',
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }
      case 500:
      case 502:
      case 503:
        throw new CongressGovApiError(
          `Server error: ${status}`,
          status,
          data
        );
      default:
        throw new CongressGovApiError(
          `API error: ${status} ${(data as { message?: string })?.message ?? 'Unknown error'}`,
          status,
          data
        );
    }
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    if (errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') {
      throw new CongressGovApiError(
        'Network error: Unable to connect to Congress.gov API',
        0
      );
    }
  }

  if (error && typeof error === 'object' && 'name' in error) {
    const errorName = (error as { name: string }).name;
    if (errorName === 'AbortError') {
      throw new CongressGovApiError(
        'Request timeout',
        408
      );
    }
  }

  const errorMessage = error && typeof error === 'object' && 'message' in error 
    ? (error as { message: string }).message 
    : 'Unknown error';

  throw new CongressGovApiError(
    `Unexpected error: ${errorMessage}`,
    500
  );
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  return error instanceof CongressGovRateLimitError || 
         error instanceof CongressGovQuotaExceededError ||
         (error instanceof CongressGovApiError && error.statusCode === 429);
}

/**
 * Check if error is a temporary error that can be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof CongressGovApiError) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  return false;
}

/**
 * Get retry delay for rate limit errors
 */
export function getRetryDelay(error: unknown): number {
  if (error instanceof CongressGovRateLimitError && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to milliseconds
  }
  
  if (isRateLimitError(error)) {
    return 60000; // 1 minute default
  }
  
  if (isRetryableError(error)) {
    return 5000; // 5 seconds for server errors
  }
  
  return 0; // Don't retry
}
