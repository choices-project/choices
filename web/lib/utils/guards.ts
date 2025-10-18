/**
 * Type guard utilities for safe boundary handling
 * 
 * These utilities provide type-safe ways to handle unknown data at API/IO boundaries,
 * eliminating the need for unsafe type assertions and reducing no-unsafe-* errors.
 * 
 * @fileoverview Safe type guards and data validation utilities
 */

/**
 * Type guard to check if a value is a record (object with string keys)
 */
export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Type guard to check if an object has a specific key
 */
export function has<T extends string>(
  obj: unknown, 
  key: T
): obj is Record<T, unknown> {
  return isRecord(obj) && key in obj;
}

/**
 * Type guard to check if an object has multiple keys
 */
export function hasKeys<T extends string>(
  obj: unknown, 
  keys: T[]
): obj is Record<T, unknown> {
  return isRecord(obj) && keys.every(key => key in obj);
}

/**
 * Safely convert unknown value to array
 */
export function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

/**
 * Safely convert unknown value to string with fallback
 */
export function toString(x: unknown, fallback = ''): string {
  if (typeof x === 'string') return x;
  if (typeof x === 'number' || typeof x === 'boolean') return String(x);
  return fallback;
}

/**
 * Safely convert unknown value to number with fallback
 */
export function toNumber(x: unknown, fallback = 0): number {
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x === 'string') {
    const parsed = Number(x);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/**
 * Safely convert unknown value to boolean
 */
export function toBoolean(x: unknown): boolean {
  if (typeof x === 'boolean') return x;
  if (typeof x === 'string') {
    const lower = x.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof x === 'number') return x !== 0;
  return Boolean(x);
}

/**
 * Safely get a property from an object with type checking
 */
export function getProperty<T>(
  obj: unknown, 
  key: string, 
  fallback: T
): T {
  if (has(obj, key)) {
    return obj[key] as T;
  }
  return fallback;
}

/**
 * Safely get a nested property from an object
 */
export function getNestedProperty<T>(
  obj: unknown, 
  path: string[], 
  fallback: T
): T {
  let current: unknown = obj;
  
  for (const key of path) {
    if (!isRecord(current) || !(key in current)) {
      return fallback;
    }
    current = current[key];
  }
  
  return current as T;
}

/**
 * Type guard for string arrays
 */
export function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(item => typeof item === 'string');
}

/**
 * Type guard for number arrays
 */
export function isNumberArray(x: unknown): x is number[] {
  return Array.isArray(x) && x.every(item => typeof item === 'number');
}

/**
 * Type guard for non-empty strings
 */
export function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0;
}

/**
 * Type guard for valid email format (basic check)
 */
export function isEmail(x: unknown): x is string {
  if (!isNonEmptyString(x)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(x);
}

/**
 * Type guard for valid UUID format
 */
export function isUUID(x: unknown): x is string {
  if (!isNonEmptyString(x)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(x);
}

/**
 * Type guard for valid date strings (ISO format)
 */
export function isISODateString(x: unknown): x is string {
  if (!isNonEmptyString(x)) return false;
  const date = new Date(x);
  return !isNaN(date.getTime()) && date.toISOString() === x;
}

/**
 * Safe JSON parsing with type checking
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJsonStringify(obj: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

/**
 * Create a type-safe property accessor
 */
export function createPropertyAccessor<T>(obj: Record<string, unknown>, key: string): T | undefined {
  return has(obj, key) ? (obj[key] as T) : undefined;
}

/**
 * Validate and transform data with a schema-like approach
 */
export function validateData<T>(
  data: unknown,
  validator: (x: unknown) => x is T,
  fallback: T
): T {
  return validator(data) ? data : fallback;
}

/**
 * Assert that a value is present (not null or undefined)
 * Throws an error with a descriptive message if the value is null or undefined
 */
export function assertPresent<T>(value: T | null | undefined, name: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name} is required but was ${value === null ? 'null' : 'undefined'}`);
  }
}

/**
 * Common validation patterns for API responses
 */
export const ApiValidators = {
  /**
   * Validate a standard API response structure
   */
  isApiResponse: (x: unknown): x is { data: unknown; error: unknown } => {
    return isRecord(x) && has(x, 'data') && has(x, 'error');
  },

  /**
   * Validate a paginated response structure
   */
  isPaginatedResponse: (x: unknown): x is { 
    data: unknown[]; 
    error: unknown; 
    count: number 
  } => {
    return isRecord(x) && 
           has(x, 'data') && 
           has(x, 'error') && 
           has(x, 'count') &&
           Array.isArray(x.data);
  },

  /**
   * Validate a success response (no error)
   */
  isSuccessResponse: (x: unknown): x is { data: unknown; error: null } => {
    return ApiValidators.isApiResponse(x) && x.error === null;
  },

  /**
   * Validate an error response
   */
  isErrorResponse: (x: unknown): x is { data: null; error: { message: string } } => {
    return ApiValidators.isApiResponse(x) && 
           x.error !== null && 
           isRecord(x.error) && 
           has(x.error, 'message') &&
           typeof x.error.message === 'string';
  }
} as const;