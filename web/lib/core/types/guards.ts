/**
 * Type Guards
 * 
 * Type guard utilities for runtime type checking
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

export class TypeGuardError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message);
    this.name = 'TypeGuardError';
  }
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Assert that value is a string, throw if not
 */
export function assertString(value: unknown, path: string): asserts value is string {
  if (!isString(value)) {
    throw new TypeGuardError(`Expected string, got ${typeof value}`, path);
  }
}

/**
 * Assert that value is a number, throw if not
 */
export function assertNumber(value: unknown, path: string): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeGuardError(`Expected number, got ${typeof value}`, path);
  }
}

/**
 * Assert that value is a boolean, throw if not
 */
export function assertBoolean(value: unknown, path: string): asserts value is boolean {
  if (!isBoolean(value)) {
    throw new TypeGuardError(`Expected boolean, got ${typeof value}`, path);
  }
}

/**
 * Assert that value is an object, throw if not
 */
export function assertObject(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeGuardError(`Expected object, got ${typeof value}`, path);
  }
}

/**
 * Assert that value is an array, throw if not
 */
export function assertArray(value: unknown, path: string): asserts value is unknown[] {
  if (!isArray(value)) {
    throw new TypeGuardError(`Expected array, got ${typeof value}`, path);
  }
}

export default {
  TypeGuardError,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isNullish,
  isNotNullish,
  assertString,
  assertNumber,
  assertBoolean,
  assertObject,
  assertArray
};