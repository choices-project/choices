/**
 * API Response Utilities
 *
 * Standardized utilities for creating consistent API responses.
 * Use these helpers in all API routes to ensure consistency.
 *
 * Created: November 6, 2025 (Phase 3)
 * Status: ✅ ACTIVE
 */

import { NextResponse } from 'next/server';

import logger from '@/lib/utils/logger';

import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiMetadata,
  PaginationMetadata,
} from './types';

// ============================================================================
// SUCCESS RESPONSE HELPERS
// ============================================================================

/**
 * Create a standardized success response
 *
 * @example
 * return successResponse({ user: userData }, { timestamp: new Date().toISOString() });
 */
export function successResponse<T>(
  data: T,
  metadata?: Partial<ApiMetadata>,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      metadata: mergeMetadataWithTimestamp(metadata),
    },
    { status }
  );
}

/**
 * Create a success response with pagination
 *
 * @example
 * return paginatedResponse(items, { total: 100, limit: 20, offset: 0 });
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: Pick<PaginationMetadata, 'total' | 'limit' | 'offset'>,
  status: number = 200
): NextResponse<ApiSuccessResponse<T[]>> {
  const hasMore = pagination.offset + pagination.limit < pagination.total;
  const page = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const paginationMetadata: PaginationMetadata = {
    total: pagination.total,
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore,
    page,
    totalPages,
  };

  return NextResponse.json(
    {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        pagination: paginationMetadata,
      },
    },
    { status }
  );
}

/**
 * Create a success response with custom metadata
 *
 * @example
 * return successWithMeta({ polls: [] }, { cached: true, ttl: 300 });
 */
export function successWithMeta<T>(
  data: T,
  customMetadata: Record<string, any>,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      metadata: mergeMetadataWithTimestamp(customMetadata),
    },
    { status }
  );
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

/**
 * Create a standardized error response
 *
 * @example
 * return errorResponse('User not found', 404);
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: string | Record<string, any>,
  code?: string
): NextResponse<ApiErrorResponse> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, sanitize error messages to prevent information leakage
  // Don't expose internal system details, file paths, or stack traces
  let sanitizedError = error;
  if (isProduction) {
    // Remove potential sensitive information
    sanitizedError = error
      .replace(/at\s+.*?\(.*?\)/g, '') // Remove stack trace snippets
      .replace(/\/[^\s]+/g, '') // Remove file paths
      .replace(/Error:\s*/gi, '') // Remove "Error:" prefix
      .trim();
    
    // If error is empty after sanitization, use generic message
    if (!sanitizedError) {
      sanitizedError = 'An error occurred';
    }
  }
  
  const payload: ApiErrorResponse = {
    success: false,
    error: sanitizedError,
    metadata: { timestamp: new Date().toISOString() },
  };

  // Only include details in development
  if (details !== undefined && details !== null && !isProduction) {
    payload.details = details;
  }

  if (code !== undefined) {
    payload.code = code;
  }

  return NextResponse.json(payload, { status });
}

/**
 * Create a validation error response
 *
 * @example
 * return validationError({ email: 'Invalid email format' });
 */
export function validationError(
  errors: Record<string, string>,
  message: string = 'Validation failed'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 400, errors, 'VALIDATION_ERROR');
}

/**
 * Create an authentication error response
 *
 * @example
 * return authError('Invalid credentials');
 */
export function authError(
  message: string = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, undefined, 'AUTH_ERROR');
}

/**
 * Create a forbidden error response
 *
 * @example
 * return forbiddenError('Admin access required');
 */
export function forbiddenError(
  message: string = 'Access forbidden'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, undefined, 'FORBIDDEN');
}

/**
 * Create a not found error response
 *
 * @example
 * return notFoundError('Poll not found');
 */
export function notFoundError(
  message: string = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 404, undefined, 'NOT_FOUND');
}

/**
 * Create a rate limit error response
 *
 * @example
 * return rateLimitError();
 */
export function rateLimitError(
  message: string = 'Rate limit exceeded',
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = errorResponse(message, 429, undefined, 'RATE_LIMIT');

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Create a method not allowed error response
 *
 * @example
 * return methodNotAllowed(['GET', 'POST']);
 */
export function methodNotAllowed(
  allowedMethods: string[]
): NextResponse<ApiErrorResponse> {
  const response = errorResponse(
    `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    405,
    undefined,
    'METHOD_NOT_ALLOWED'
  );

  response.headers.set('Allow', allowedMethods.join(', '));

  return response;
}

/**
 * Create an internal server error response
 *
 * @example
 * return serverError(error);
 */
export function serverError(
  error?: Error | unknown,
  includeStack: boolean = process.env.NODE_ENV === 'development'
): NextResponse<ApiErrorResponse> {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const details = includeStack && error instanceof Error ? { stack: error.stack } : undefined;

  return errorResponse(message, 500, details, 'SERVER_ERROR');
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Wrap an async API handler with error handling
 *
 * @example
 * export const GET = withErrorHandling(async (request) => {
 *   const data = await fetchData();
 *   return successResponse(data);
 * });
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Log full error details for debugging (server-side only)
      const errorDetails = error instanceof Error 
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : { error: String(error) };
      
      logger.error('API Error:', errorDetails);
      
      // Use serverError which already handles production sanitization
      return serverError(error);
    }
  };
}

/**
 * Parse and validate request body
 *
 * @example
 * const body = await parseBody(request, z.object({ email: z.string().email() }));
 * if (!body.success) return body.error;
 */
export async function parseBody<T>(
  request: Request,
  schema?: { parse: (data: unknown) => T }
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();

    if (schema) {
      try {
        const validated = schema.parse(body);
        return { success: true, data: validated };
      } catch (error) {
        return {
          success: false,
          error: validationError(
            error instanceof Error ? { _error: error.message } : { _error: 'Validation failed' }
          ),
        };
      }
    }

    return { success: true, data: body as T };
  } catch {
    return {
      success: false,
      error: errorResponse('Invalid JSON body', 400),
    };
  }
}

/**
 * Parse and validate query parameters
 *
 * @example
 * const query = parseQuery(request, { limit: 'number', offset: 'number' });
 * if (!query.success) return query.error;
 */
export function parseQuery<T extends Record<string, 'string' | 'number' | 'boolean'>>(
  request: Request,
  schema: T
): {
  success: true;
  data: { [K in keyof T]: T[K] extends 'string' ? string : T[K] extends 'number' ? number : boolean };
} | {
  success: false;
  error: NextResponse;
} {
  const url = new URL(request.url);
  const result: any = {};
  const errors: Record<string, string> = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = url.searchParams.get(key);

    if (value === null) {
      // Optional parameter
      continue;
    }

    switch (type) {
      case 'string':
        result[key] = value;
        break;
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          errors[key] = `Expected number, got "${value}"`;
        } else {
          result[key] = num;
        }
        break;
      }
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          errors[key] = `Expected boolean, got "${value}"`;
        } else {
          result[key] = value === 'true';
        }
        break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      error: validationError(errors, 'Invalid query parameters'),
    };
  }

  return { success: true, data: result };
}

// ============================================================================
// RESPONSE TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transform database records to API format
 * Removes sensitive fields and formats dates
 *
 * @example
 * const user = sanitizeResponse(dbUser, ['password', 'token']);
 */
export function sanitizeResponse<T extends Record<string, any>>(
  data: T,
  removeFields: string[] = []
): Omit<T, typeof removeFields[number]> {
  const sanitized = cloneWithoutUndefined(data);

  for (const field of removeFields) {
    delete sanitized[field];
  }

  return sanitized;
}

/**
 * Convert snake_case keys to camelCase
 *
 * @example
 * const data = toCamelCase({ user_name: 'John', created_at: '2024-01-01' });
 * // Returns: { userName: 'John', createdAt: '2024-01-01' }
 */
export function toCamelCase<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }

  return result;
}

const mergeMetadataWithTimestamp = (
  metadata?: Partial<ApiMetadata> | Record<string, any>,
): ApiMetadata => {
  const base: ApiMetadata = { timestamp: new Date().toISOString() };
  if (!metadata) {
    return base;
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      base[key] = value;
    }
  }
  return base;
};

const cloneWithoutUndefined = <T extends Record<string, any>>(data: T): T => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
};

/**
 * Convert camelCase keys to snake_case
 *
 * @example
 * const data = toSnakeCase({ userName: 'John', createdAt: '2024-01-01' });
 * // Returns: { user_name: 'John', created_at: '2024-01-01' }
 */
export function toSnakeCase<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }

  return result;
}

// ============================================================================
// CORS HELPERS
// ============================================================================

/**
 * Add CORS headers to response
 *
 * @example
 * return withCors(successResponse(data));
 */
export function withCors(
  response: NextResponse,
  options: {
    origin?: string;
    methods?: string[];
    credentials?: boolean;
  } = {}
): NextResponse {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials = true,
  } = options;

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

/**
 * Handle OPTIONS request for CORS preflight
 *
 * @example
 * export async function OPTIONS() {
 *   return corsPreflightResponse();
 * }
 */
export function corsPreflightResponse(
  methods: string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': methods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

