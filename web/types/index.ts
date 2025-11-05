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

// Database types (generated) - must come first to avoid conflicts
export * from './database';

// Feature-specific types
export * from './features/analytics/index';
export * from './features/polls/index';
export * from './features/dashboard/index';
// Auth types handled by database export
// export * from './features/auth/index';
// Hashtag types handled by database export  
// export * from './features/hashtags/index';

// External service types
export * from './external/index';

// Type utilities
export * from './utils/index';

// Candidate platform types
export * from './candidate';

// Global types - declaration file, no need to export
