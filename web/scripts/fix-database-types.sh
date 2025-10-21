#!/bin/bash

# Create corrected Database types with only existing interfaces
cat > types/database_corrected.ts <<'EOF'
// Generated Supabase Database types from actual database schema
// Generated on: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
// Based on actual database schema analysis - only includes interfaces that exist

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Individual interfaces from db-types.ts
EOF

# Append the individual interfaces from db-types.ts
cat types/db-types.ts >> types/database_corrected.ts

# Append the corrected Supabase Database structure with only existing interfaces
cat >> types/database_corrected.ts <<'EOF'

// Supabase Database type structure - only includes tables with existing interfaces
export interface Database {
  public: {
    Tables: {
      polls: {
        Row: Polls
        Insert: Omit<Polls, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Polls, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: UserProfiles
        Insert: Omit<UserProfiles, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserProfiles, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      votes: {
        Row: Votes
        Insert: Omit<Votes, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Votes, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: Feedback
        Insert: Omit<Feedback, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Feedback, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: Candidates
        Insert: Omit<Candidates, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Candidates, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: AnalyticsEvents
        Insert: Omit<AnalyticsEvents, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<AnalyticsEvents, 'id' | 'created_at'>>
        Relationships: []
      }
      user_profiles_encrypted: {
        Row: UserProfilesEncrypted
        Insert: Omit<UserProfilesEncrypted, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserProfilesEncrypted, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      private_user_data: {
        Row: PrivateUserData
        Insert: Omit<PrivateUserData, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<PrivateUserData, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      // Add placeholder for webauthn_credentials since it's used in code but interface doesn't exist
      webauthn_credentials: {
        Row: {
          id: string
          user_id: string
          credential_id: string
          public_key: string
          counter: number
          created_at?: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          credential_id: string
          public_key: string
          counter: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          credential_id?: string
          public_key?: string
          counter?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
EOF

echo "✅ Created corrected Supabase Database types"
echo "📁 File: types/database_corrected.ts"
echo "🔧 This includes:"
echo "   - Only interfaces that actually exist in db-types.ts"
echo "   - Placeholder for webauthn_credentials table"
echo "   - Proper Supabase Database type structure"
