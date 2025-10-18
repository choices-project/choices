/**
 * Supabase Types Re-export
 * 
 * Centralized re-export of Supabase database types for easy importing
 * across the application.
 */

// Re-export database types from Supabase client
export type { Database } from '@/utils/supabase/client';

// Re-export server-side database types if needed
export type { Database as ServerDatabase } from '@/utils/supabase/server';
