/**
 * Object Utilities for Exact Optional Property Types
 * 
 * Handles strict TypeScript optional property handling
 * Prevents "undefined not assignable to optional property" errors
 */

/**
 * Conditionally spread properties only if they are not null/undefined
 * Prevents exactOptionalPropertyTypes violations
 * Phase 4: Improved implementation for better performance
 */
export function withOptional<T extends object>(
  base: T,
  extras: Record<string, unknown>
) {
  const out = { ...base } as Record<string, unknown>
  for (const [k, v] of Object.entries(extras)) {
    if (v != null) out[k] = v
  }
  return out as T
}

/**
 * Create an object with only defined properties
 * Useful for API payloads with optional fields
 */
export function createPayload<T extends Record<string, unknown>>(data: T): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      (result as Record<string, unknown>)[key] = value
    }
  }
  return result
}

/**
 * Merge objects with null/undefined filtering
 * Prevents exactOptionalPropertyTypes violations
 */
export function mergeOptional<T extends object, U extends object>(base: T, extras: U): T & Partial<U> {
  const result = { ...base } as Record<string, unknown>
  for (const [key, value] of Object.entries(extras)) {
    if (value !== null && value !== undefined) {
      result[key] = value
    }
  }
  return result as T & Partial<U>
}
