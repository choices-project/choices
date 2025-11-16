/**
 * Validation Utilities
 *
 * Safe parsing utilities with comprehensive error handling for runtime validation
 */

import type { ZodError, ZodSchema } from 'zod';

import { logger } from '@/lib/utils/logger';

function mergeDefined<T extends object, U extends object>(base: T, extras?: U): T & Partial<U> {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  if (extras) {
    for (const [k, v] of Object.entries(extras as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = v;
      }
    }
  }
  return out as T & Partial<U>;
}

/**
 * Result of a validation operation
 */
export type ValidationResult<T> = {
  /** Whether the validation was successful */
  success: boolean;
  /** The validated data (only present if success is true) */
  data?: T;
  /** Error message (only present if success is false) */
  error?: string;
  /** Detailed Zod error information (only present if success is false) */
  details?: ZodError;
}

/**
 * Options for validation operations
 */
export type ValidationOptions = {
  /** Whether to log validation errors to the logger */
  logErrors?: boolean;
  /** Whether to throw an error on validation failure */
  throwOnError?: boolean;
  /** Fallback data to use if validation fails */
  fallbackData?: unknown;
}

function mergeOptions(options: ValidationOptions | undefined, extras: ValidationOptions): ValidationOptions {
  return mergeDefined(mergeDefined(options ?? {}), extras);
}

/**
 * Safely parse data with a Zod schema
 *
 * This function provides comprehensive error handling and logging for schema validation.
 * It returns a result object instead of throwing errors, making it safe to use in
 * production code.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns ValidationResult with success status and data or error information
 *
 * @example
 * ```typescript
 * const result = safeParse(UserProfileSchema, userData);
 * if (result.success) {
 *   const profile = result.data; // Fully typed UserProfile
 * } else {
 *   logger.error('Validation failed:', result.error);
 * }
 * ```
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult<T> {
  const { logErrors = true, throwOnError = false } = options;

  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return mergeDefined({ success: true as const }, { data: result.data });
    } else {
      const errorMessage = `Validation failed: ${result.error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')}`;

      if (logErrors) {
        logger.error('Schema validation failed', {
          error: errorMessage,
          issues: result.error.issues,
          data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
        });
      }

      if (throwOnError) {
        throw new Error(errorMessage);
      }

      return mergeDefined({ success: false as const }, { error: errorMessage, details: result.error });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

    if (logErrors) {
      logger.error('Validation parsing failed', {
        error: errorMessage,
        data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
      });
    }

    if (throwOnError) {
      throw error;
    }

    return mergeDefined({ success: false as const }, { error: errorMessage });
  }
}

/**
 * Parse data with fallback to default value
 *
 * This function attempts to validate data against a schema, and if validation fails,
 * it returns the provided fallback value instead of throwing an error. This is useful
 * for providing default values when data validation fails.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param fallback - The fallback value to return if validation fails
 * @param options - Validation options
 * @returns The validated data or the fallback value
 *
 * @example
 * ```typescript
 * const user = parseWithFallback(UserProfileSchema, userData, defaultUser);
 * // user will be either the validated data or defaultUser
 * ```
 */
export function parseWithFallback<T>(
  schema: ZodSchema<T>,
  data: unknown,
  fallback: T,
  options: ValidationOptions = {}
): T {
  const result = safeParse(schema, data, mergeOptions(options, { logErrors: true }));

  if (result.success && result.data !== undefined) {
    return result.data;
  }

  if (options.logErrors) {
    logger.warn('Using fallback data due to validation failure', {
      error: result.error,
      fallback: typeof fallback === 'object' ? JSON.stringify(fallback, null, 2) : fallback,
    });
  }

  return fallback;
}

/**
 * Parse array of data with filtering of invalid items
 */
export function parseArray<T>(
  schema: ZodSchema<T>,
  data: unknown[],
  options: ValidationOptions = {}
): T[] {
  const validItems: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = safeParse(schema, data[i], mergeOptions(options, { logErrors: false }));

    if (result.success && result.data !== undefined) {
      validItems.push(result.data);
    } else {
      errors.push(`Item ${i}: ${result.error ?? 'Unknown error'}`);
    }
  }

  if (errors.length > 0 && options.logErrors) {
    logger.warn('Some array items failed validation', {
      totalItems: data.length,
      validItems: validItems.length,
      errors,
    });
  }

  return validItems;
}

/**
 * Validate database response with proper error handling
 *
 * This function validates database responses from Supabase, handling both database
 * errors and data validation errors. It provides comprehensive error information
 * for debugging and monitoring.
 *
 * @param schema - The Zod schema to validate against
 * @param response - The database response object with data and error properties
 * @param options - Validation options
 * @returns ValidationResult with success status and data or error information
 *
 * @example
 * ```typescript
 * const { data, error } = await supabase.from('users').select('*').single();
 * const result = validateDatabaseResponse(UserProfileSchema, { data, error });
 * if (result.success) {
 *   const user = result.data; // Fully typed UserProfile
 * }
 * ```
 */
export function validateDatabaseResponse<T>(
  schema: ZodSchema<T>,
  response: { data: unknown; error: Error | null },
  options: ValidationOptions = {}
): ValidationResult<T> {
  if (response.error) {
    const errorMessage = `Database error: ${response.error.message}`;

    if (options.logErrors) {
      logger.error('Database response validation failed due to database error', {
        error: errorMessage,
        databaseError: response.error,
      });
    }

    return mergeDefined({ success: false as const }, { error: errorMessage });
  }

  return safeParse(schema, response.data, options);
}

/**
 * Validate multiple database responses
 */
export function validateMultipleResponses<T>(
  schema: ZodSchema<T>,
  responses: Array<{ data: unknown; error: Error | null }>,
  options: ValidationOptions = {}
): ValidationResult<T[]> {
  const validItems: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response) continue;
    const result = validateDatabaseResponse(schema, response, mergeOptions(options, { logErrors: false }));

    if (result.success && result.data !== undefined) {
      validItems.push(result.data);
    } else {
      errors.push(`Response ${i}: ${result.error ?? 'Unknown error'}`);
    }
  }

  if (errors.length > 0 && options.logErrors) {
    logger.warn('Some database responses failed validation', {
      totalResponses: responses.length,
      validResponses: validItems.length,
      errors,
    });
  }

  return mergeDefined(
    { success: validItems.length > 0 },
    { data: validItems, error: errors.length > 0 ? errors.join('; ') : undefined }
  );
}

/**
 * Create a validator function for a specific schema
 */
export function createValidator<T>(schema: ZodSchema<T>) {
  return (data: unknown, options?: ValidationOptions) => safeParse(schema, data, options);
}

/**
 * Validate and transform data
 */
export function validateAndTransform<T, U>(
  schema: ZodSchema<T>,
  data: unknown,
  transform: (validData: T) => U,
  options: ValidationOptions = {}
): ValidationResult<U> {
  const validationResult = safeParse(schema, data, options);

  if (!validationResult.success || validationResult.data === undefined) {
    const failure: ValidationResult<U> = { success: false };
    if (validationResult.error !== undefined) {
      failure.error = validationResult.error;
    }
    if (validationResult.details !== undefined) {
      failure.details = validationResult.details as unknown as import('zod').ZodError;
    }
    return failure;
  }

  try {
    const transformed = transform(validationResult.data);
    return mergeDefined({ success: true as const }, { data: transformed });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transform failed';

    if (options.logErrors) {
      logger.error('Data transformation failed', {
        error: errorMessage,
        originalData: validationResult.data,
      });
    }

    return mergeDefined({ success: false as const }, { error: errorMessage });
  }
}

/**
 * Batch validation for multiple schemas
 */
export function validateBatch<T extends Record<string, unknown>>(
  schemas: { [K in keyof T]: ZodSchema<T[K]> },
  data: Record<string, unknown>,
  options: ValidationOptions = {}
): ValidationResult<T> {
  const result: Partial<T> = {};
  const errors: string[] = [];

  for (const [key, schema] of Object.entries(schemas)) {
    const validationResult = safeParse(schema, data[key], mergeOptions(options, { logErrors: false }));

    if (validationResult.success && validationResult.data !== undefined) {
      (result as Record<string, unknown>)[key] = validationResult.data;
    } else {
      errors.push(`${key}: ${validationResult.error ?? 'Unknown error'}`);
    }
  }

  if (errors.length > 0 && options.logErrors) {
    logger.warn('Batch validation had errors', {
      errors,
      validFields: Object.keys(result),
    });
  }

  return mergeDefined(
    { success: errors.length === 0 },
    { data: result as T, error: errors.length > 0 ? errors.join('; ') : undefined }
  );
}
