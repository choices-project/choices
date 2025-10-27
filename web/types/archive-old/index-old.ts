/**
 * Centralized Type System
 * 
 * Single source of truth for all application types
 * Organized by domain for easy discovery and maintenance
 * 
 * Created: October 26, 2025
 * Status: ✅ ACTIVE
 */

// ============================================================================
// DATABASE TYPES
// ============================================================================
export * from './database';

// ============================================================================
// API TYPES  
// ============================================================================
export * from './api';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================
export * from './auth';

// ============================================================================
// POLL TYPES
// ============================================================================
export * from './polls';

// ============================================================================
// USER TYPES
// ============================================================================
export * from './users';

// ============================================================================
// ANALYTICS TYPES
// ============================================================================
export * from './analytics';

// ============================================================================
// SHARED TYPES
// ============================================================================
export * from './shared';

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Type utility for creating branded types
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Type utility for creating optional properties
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type utility for creating required properties
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Type utility for creating readonly properties
 */
export type Readonly<T, K extends keyof T> = Omit<T, K> & { readonly [P in K]: T[P] };
