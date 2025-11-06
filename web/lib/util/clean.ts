/**
 * Phase 4: exactOptionalPropertyTypes Cleanup Utilities
 * 
 * Core utilities to eliminate undefined assignments and ensure type safety
 * without loosening TypeScript configuration
 */

/**
 * Convert undefined to null for Supabase compatibility
 * Supabase expects null for optional fields, not undefined
 */
export function undefinedToNull<T extends Record<string, unknown>>(obj: T): {
  [K in keyof T]: T[K] extends undefined ? null : T[K] extends Record<string, unknown> ? ReturnType<typeof undefinedToNull<T[K]>> : T[K] extends (infer U)[] ? U[] : T[K]
} {
  if (Array.isArray(obj)) {
    return obj.map(undefinedToNull) as never
  }
  
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = v === undefined ? null : (typeof v === 'object' && v !== null ? undefinedToNull(v as Record<string, unknown>) : v)
    }
    return out as never
  }
  
  return obj as never
}

/**
 * Recursively strips undefined values from objects and arrays
 * Essential for DB writes and object construction with exactOptionalPropertyTypes
 */
export function stripUndefinedDeep<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map(stripUndefinedDeep) as T
  }
  
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) {
      if (v === undefined) continue
      out[k] = stripUndefinedDeep(v)
    }
    return out as T
  }
  
  return input
}

/**
 * Type guard to check if a value is present (not null or undefined)
 * More explicit than just truthy checks
 */
export const isPresent = <T>(x: T): x is NonNullable<T> => x != null

/**
 * Filter array to remove null/undefined values with proper typing
 */
export function filterPresent<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isPresent)
}

/**
 * Safe object property access with fallback
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K, 
  fallback: T[K]
): T[K] {
  return obj?.[key] ?? fallback
}

/**
 * Create object with only defined properties (no undefined keys)
 */
export function createCleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key as keyof T] = value as T[keyof T]
    }
  }
  return result
}
