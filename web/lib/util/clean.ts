/**
 * Phase 4: exactOptionalPropertyTypes Cleanup Utilities
 * 
 * Core utilities to eliminate undefined assignments and ensure type safety
 * without loosening TypeScript configuration
 */

/**
 * Recursively strips undefined values from objects and arrays
 * Essential for DB writes and object construction with exactOptionalPropertyTypes
 */
export function stripUndefinedDeep<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map(stripUndefinedDeep) as any
  }
  
  if (input && typeof input === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(input)) {
      if (v === undefined) continue
      out[k] = stripUndefinedDeep(v)
    }
    return out
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
export function createCleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value
    }
  }
  return result
}
