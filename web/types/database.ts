/**
 * Database Types
 * 
 * Re-exports the generated Supabase database types for convenience.
 * The source of truth is `@/utils/supabase/database.types.ts`.
 * 
 * DO NOT manually edit - types are regenerated from the database schema.
 * To regenerate: npm run types:generate
 * 
 * Created: January 26, 2025
 * Updated: January 2025 - Supabase CLI v2.54.11 linked and types generated
 */

// Re-export Database type explicitly for convenience
export type { Database } from '@/utils/supabase/database.types'

// Common Supabase types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
