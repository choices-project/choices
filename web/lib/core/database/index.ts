/**
 * Database Types Barrel Export
 * 
 * Centralized re-export point for all database-related types.
 * This resolves TS2307 "cannot find module" errors for database imports.
 */

// Re-export your generated Database types or table interfaces here
// Import from the current Supabase server types
export type { Database } from '@/utils/supabase/server';

// Common database utility types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  ssl?: boolean;
}

export interface QueryResult<T = unknown> {
  data: T[];
  error?: string;
  count?: number;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
}

// Re-export Supabase types if available
export type { User, Session } from '@supabase/supabase-js';

// Placeholder for generated types - replace with actual generated file
// export type { Database } from './generated';