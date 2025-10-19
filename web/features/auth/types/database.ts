/**
 * Auth Feature Database Types
 * 
 * Database type definitions for authentication-related tables only.
 * This follows the existing feature-specific type architecture.
 * 
 * Created: October 19, 2025
 * Status: ✅ ACTIVE
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AuthDatabase {
  public: {
    Tables: {
      webauthn_credentials: {
        Row: {
          id: string
          user_id: string
          credential_id: string
          public_key: string
          counter: number
          transports: string[] | null
          created_at: string | null
          updated_at: string | null
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          credential_id: string
          public_key: string
          counter: number
          transports?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          credential_id?: string
          public_key?: string
          counter?: number
          transports?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          last_used_at?: string | null
        }
      }
      
      webauthn_challenges: {
        Row: {
          id: string
          user_id: string
          challenge: string
          created_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          challenge: string
          created_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          challenge?: string
          created_at?: string | null
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Re-export specific table types for convenience
export type WebAuthnCredential = AuthDatabase['public']['Tables']['webauthn_credentials']['Row']
export type WebAuthnCredentialInsert = AuthDatabase['public']['Tables']['webauthn_credentials']['Insert']
export type WebAuthnCredentialUpdate = AuthDatabase['public']['Tables']['webauthn_credentials']['Update']

export type WebAuthnChallenge = AuthDatabase['public']['Tables']['webauthn_challenges']['Row']
export type WebAuthnChallengeInsert = AuthDatabase['public']['Tables']['webauthn_challenges']['Insert']
export type WebAuthnChallengeUpdate = AuthDatabase['public']['Tables']['webauthn_challenges']['Update']
