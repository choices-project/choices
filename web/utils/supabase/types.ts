/**
 * Type-only exports for Supabase database types.
 *
 * This file contains only type definitions and can be safely imported
 * by client components using `import type`.
 *
 * For server-only runtime functions, use @/utils/supabase/server
 */

import type { Database } from '@/types/supabase'

// Re-export the main Database type
export type { Database }

// Alias for convenience
export type DatabaseTypes = Database

// Core table types (tables that exist in the database)
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type CandidatePlatform = Database['public']['Tables']['candidate_platforms']['Row']
export type RepresentativeCore = Database['public']['Tables']['representatives_core']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']
export type WebAuthnChallenge = Database['public']['Tables']['webauthn_challenges']['Row']

