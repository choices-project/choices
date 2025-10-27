/**
 * TYPES Main Index
 * 
 * Centralized type system for Choices platform
 * Clean, organized, and maintainable type structure
 * 
 * Created: October 26, 2025
 * Status: ✅ ACTIVE
 */

// Core system types
export * from './core/index';

// Feature-specific types
export * from './features/analytics/index';
export * from './features/polls/index';
export * from './features/dashboard/index';
export * from './features/auth/index';
export * from './features/hashtags/index';

// External service types
export * from './external/index';

// Type utilities
export * from './utils/index';

// Database types (generated)
export * from './database.types';

// Global types
export * from './global.d.ts';
