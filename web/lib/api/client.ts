/**
 * API Client Utilities
 *
 * Type-safe API client helpers for frontend code.
 * Provides consistent error handling and type inference.
 *
 * Created: November 6, 2025 (Phase 3)
 * Status: ✅ ACTIVE
 */

import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from './types';

// ============================================================================
// API CLIENT ERROR
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is a forbidden error
   */
  isForbiddenError(): boolean {
    return this.status === 403;
  }

  /**
   * Check if error is a not found error
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimitError(): boolean {
    return this.status === 429;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.status === 400 && this.code === 'VALIDATION_ERROR';
  }

  /**
   * Check if error is a server error
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

// ============================================================================
// API CLIENT OPTIONS
// ============================================================================

export type ApiClientOptions = {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onError?: (error: ApiError) => void;
  onSuccess?: (response: any) => void;
} & RequestInit

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Make a type-safe API request
 *
 * @example
 * const user = await apiClient<UserProfile>('/api/profile');
 * const polls = await apiClient<Poll[]>('/api/polls', { method: 'GET' });
 */
export async function apiClient<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const {
    baseUrl = '',
    timeout = 30000,
    retries = 0,
    retryDelay = 1000,
    onError,
    onSuccess,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (fetchOptions.headers) {
      const originalHeaders = new Headers(fetchOptions.headers);
      originalHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const requestInit: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
      headers,
    };

    const response = await fetchWithRetry(
      `${baseUrl}${url}`,
      requestInit,
      retries,
      retryDelay
    );

    clearTimeout(timeoutId);

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      const error = new ApiError(
        (data as ApiErrorResponse).error || 'Request failed',
        response.status,
        (data as ApiErrorResponse).code,
        (data as ApiErrorResponse).details
      );

      if (onError) {
        onError(error);
      }

      throw error;
    }

    if ('success' in data && data.success === false) {
      const error = new ApiError(
        data.error,
        response.status,
        data.code,
        data.details
      );

      if (onError) {
        onError(error);
      }

      throw error;
    }

    const result = 'data' in data ? (data as ApiSuccessResponse<T>).data : (data as T);

    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError(error.message, 500);
    }

    throw new ApiError('Unknown error occurred', 500);
  }
}

/**
 * Fetch with automatic retries
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  delay: number
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

/**
 * Make a GET request
 */
export async function get<T = any>(
  url: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(url, mergeClientOptions(options, { method: 'GET' }));
}

/**
 * Make a POST request
 */
export async function post<T = any>(
  url: string,
  body?: any,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(url, mergeClientOptions(options, buildMethodOptions('POST', body)));
}

/**
 * Make a PUT request
 */
export async function put<T = any>(
  url: string,
  body?: any,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(url, mergeClientOptions(options, buildMethodOptions('PUT', body)));
}

/**
 * Make a PATCH request
 */
export async function patch<T = any>(
  url: string,
  body?: any,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(url, mergeClientOptions(options, buildMethodOptions('PATCH', body)));
}

/**
 * Make a DELETE request
 */
export async function del<T = any>(
  url: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>
): Promise<T> {
  return apiClient<T>(url, mergeClientOptions(options, { method: 'DELETE' }));
}

// ============================================================================
// REACT QUERY HELPERS
// ============================================================================

/**
 * Create a fetch function for React Query
 *
 * @example
 * const { data } = useQuery({
 *   queryKey: ['profile'],
 *   queryFn: createQueryFn<UserProfile>('/api/profile')
 * });
 */
export function createQueryFn<T>(url: string, options?: ApiClientOptions) {
  return async (): Promise<T> => {
    return apiClient<T>(url, options);
  };
}

/**
 * Create a mutation function for React Query
 *
 * @example
 * const mutation = useMutation({
 *   mutationFn: createMutationFn<UserProfile, ProfileUpdateRequest>('/api/profile', 'PUT')
 * });
 */
export function createMutationFn<TResult, TVariables = void>(
  url: string | ((variables: TVariables) => string),
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: Omit<ApiClientOptions, 'method' | 'body'>
) {
  return async (variables: TVariables): Promise<TResult> => {
    const finalUrl = typeof url === 'function' ? url(variables) : url;

    return apiClient<TResult>(
      finalUrl,
      mergeClientOptions(
        options,
        method !== 'DELETE' ? buildMethodOptions(method, variables) : { method }
      ),
    );
  };
}

function mergeClientOptions(
  options: ApiClientOptions | undefined,
  extras: Record<string, unknown>
): ApiClientOptions {
  const baseOptions: Record<string, unknown> = { ...(options ?? {}) };
  for (const [key, value] of Object.entries(extras)) {
    if (value !== undefined) {
      baseOptions[key] = value;
    } else {
      delete baseOptions[key];
    }
  }
  return baseOptions as ApiClientOptions;
}

const buildMethodOptions = (method: string, body?: unknown): Record<string, unknown> => {
  const result: Record<string, unknown> = { method };
  if (body !== undefined && body !== null) {
    result.body = JSON.stringify(body);
  }
  return result;
};

// ============================================================================
// SPECIALIZED API CLIENTS
// ============================================================================

/**
 * Profile API client
 */
export const profileApi = {
  get: () => get('/api/profile'),
  update: (data: any) => post('/api/profile', { profile: data }),
  delete: () => del('/api/profile'),
  export: () => get('/api/profile/export'),
};

/**
 * Dashboard API client
 */
export const dashboardApi = {
  get: (cache: boolean = true) => get(`/api/dashboard${cache ? '' : '?cache=false'}`),
};

/**
 * Feedback API client
 */
export const feedbackApi = {
  submit: (feedback: any) => post('/api/feedback', feedback),
  list: (filters?: Record<string, string>) => {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return get(`/api/feedback${params}`);
  },
};

/**
 * Trending API client
 */
export const trendingApi = {
  polls: (limit: number = 10) => get(`/api/trending?type=polls&limit=${limit}`),
  hashtags: (limit: number = 20) => get(`/api/trending?type=hashtags&limit=${limit}`),
  topics: (limit: number = 15) => get(`/api/trending?type=topics&limit=${limit}`),
};

/**
 * Health API client
 */
export const healthApi = {
  basic: () => get('/api/health'),
  database: () => get('/api/health?type=database'),
  extended: () => get('/api/health/extended'),
  all: () => get('/api/health?type=all'),
};

/**
 * Auth API client
 */
export const authApi = {
  login: (email: string, password: string) => post('/api/auth/login', { email, password }),
  register: (data: any) => post('/api/auth/register', data),
  logout: () => post('/api/auth/logout'),
  me: () => get('/api/auth/me'),
};

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Handle API error with user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error requires re-authentication
 */
export function shouldReAuthenticate(error: unknown): boolean {
  return error instanceof ApiError && error.isAuthError();
}

/**
 * Check if request should be retried
 */
export function shouldRetry(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // Retry on server errors and rate limits (after delay)
  return error.isServerError() || error.isRateLimitError();
}

