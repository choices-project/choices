// API Response Types - Discriminated Union Pattern
// Created: 2025-01-16
// Purpose: Type-safe API responses with discriminated unions

/**
 * Successful API response
 */
export type ApiOk<T> = { 
  ok: true; 
  data: T;
  message?: string;
}

/**
 * Error API response
 */
export type ApiErr = { 
  ok: false; 
  code: string; 
  message: string; 
  errors?: string[];
  details?: Record<string, unknown>;
}

/**
 * Discriminated union for all API responses
 */
export type ApiResult<T> = ApiOk<T> | ApiErr;

/**
 * Paginated API response
 */
export type ApiPaginated<T> = ApiOk<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Convert unknown error to ApiErr
 */
export function toApiError(e: unknown, code = 'UNKNOWN'): ApiErr {
  const msg = e instanceof Error ? e.message : String(e ?? 'Unexpected error');
  return { ok: false, code, message: msg };
}

/**
 * Type guard to check if result is successful
 */
export function isApiOk<T>(result: ApiResult<T>): result is ApiOk<T> {
  return result.ok === true;
}

/**
 * Type guard to check if result is error
 */
export function isApiErr<T>(result: ApiResult<T>): result is ApiErr {
  return result.ok === false;
}


