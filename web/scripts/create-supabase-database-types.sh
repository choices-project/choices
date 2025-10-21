#!/bin/bash

# Create comprehensive Supabase Database types using here-doc
# This combines individual interfaces with proper Supabase Database structure

cat > types/database_supabase.ts <<'EOF'
// Generated Supabase Database types from actual database schema
// Generated on: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
// Based on actual database schema analysis

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
cat types/db-types.ts >> types/database_supabase.ts

# Append the Supabase Database structure
cat >> types/database_supabase.ts <<'EOF'

// Supabase Database type structure
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
      hashtags: {
        Row: Hashtags
        Insert: Omit<Hashtags, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Hashtags, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      representatives_core: {
        Row: RepresentativesCore
        Insert: Omit<RepresentativesCore, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<RepresentativesCore, 'id' | 'created_at'>> & {
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
      user_notification_preferences: {
        Row: UserNotificationPreferences
        Insert: Omit<UserNotificationPreferences, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserNotificationPreferences, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      hashtag_usage: {
        Row: HashtagUsage
        Insert: Omit<HashtagUsage, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<HashtagUsage, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      hashtag_flags: {
        Row: HashtagFlags
        Insert: Omit<HashtagFlags, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<HashtagFlags, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: WebauthnCredentials
        Insert: Omit<WebauthnCredentials, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<WebauthnCredentials, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      user_hashtags: {
        Row: UserHashtags
        Insert: Omit<UserHashtags, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserHashtags, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: WebauthnChallenges
        Insert: Omit<WebauthnChallenges, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<WebauthnChallenges, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      trust_tier_analytics: {
        Row: TrustTierAnalytics
        Insert: Omit<TrustTierAnalytics, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<TrustTierAnalytics, 'id' | 'created_at'>> & {
          updated_at?: string
        }
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
      user_consent: {
        Row: UserConsent
        Insert: Omit<UserConsent, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserConsent, 'id' | 'created_at'>> & {
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
      demographic_analytics: {
        Row: DemographicAnalytics
        Insert: Omit<DemographicAnalytics, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<DemographicAnalytics, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: AdminActivityLog
        Insert: Omit<AdminActivityLog, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<AdminActivityLog, 'id' | 'created_at'>> & {
          updated_at?: string
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

echo "✅ Created comprehensive Supabase Database types"
echo "📁 File: types/database_supabase.ts"
echo "🔧 This includes:"
echo "   - Individual interfaces from db-types.ts"
echo "   - Proper Supabase Database type structure"
echo "   - Correct Insert/Update types for all core tables"
