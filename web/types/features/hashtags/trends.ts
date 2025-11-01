/**
 * Hashtags Feature Database Types
 * 
 * Database type definitions for hashtag-related tables only.
 * This follows the existing feature-specific type architecture.
 * 
 * Created: October 19, 2025
 * Status: ✅ ACTIVE
 */

import type { Json } from '../../database';

export type HashtagsDatabase = {
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
// Database types only - interface types are exported from hashtags.ts
