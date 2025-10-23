/**
 * Hashtags Feature Database Types
 * 
 * Database type definitions for hashtag-related tables only.
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

export interface HashtagsDatabase {
  public: {
    Tables: {
      hashtags: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          category: string | null
          usage_count: number | null
          follower_count: number | null
          is_trending: boolean | null
          trend_score: number | null
          engagement_rate: number | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          is_verified: boolean | null
          is_featured: boolean | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          category?: string | null
          usage_count?: number | null
          follower_count?: number | null
          is_trending?: boolean | null
          trend_score?: number | null
          engagement_rate?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          is_verified?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          category?: string | null
          usage_count?: number | null
          follower_count?: number | null
          is_trending?: boolean | null
          trend_score?: number | null
          engagement_rate?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          is_verified?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
        }
      }
      
      hashtag_flags: {
        Row: {
          id: string
          hashtag: string
          reporter_id: string | null
          reason: string
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          hashtag: string
          reporter_id?: string | null
          reason: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          hashtag?: string
          reporter_id?: string | null
          reason?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      
      hashtag_usage: {
        Row: {
          id: string
          hashtag_id: string
          user_id: string | null
          context_type: string | null
          context_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          hashtag_id: string
          user_id?: string | null
          context_type?: string | null
          context_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          hashtag_id?: string
          user_id?: string | null
          context_type?: string | null
          context_id?: string | null
          created_at?: string | null
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
export type Hashtag = HashtagsDatabase['public']['Tables']['hashtags']['Row']
export type HashtagInsert = HashtagsDatabase['public']['Tables']['hashtags']['Insert']
export type HashtagUpdate = HashtagsDatabase['public']['Tables']['hashtags']['Update']

export type HashtagFlag = HashtagsDatabase['public']['Tables']['hashtag_flags']['Row']
export type HashtagFlagInsert = HashtagsDatabase['public']['Tables']['hashtag_flags']['Insert']
export type HashtagFlagUpdate = HashtagsDatabase['public']['Tables']['hashtag_flags']['Update']

export type HashtagUsage = HashtagsDatabase['public']['Tables']['hashtag_usage']['Row']
export type HashtagUsageInsert = HashtagsDatabase['public']['Tables']['hashtag_usage']['Insert']
export type HashtagUsageUpdate = HashtagsDatabase['public']['Tables']['hashtag_usage']['Update']
