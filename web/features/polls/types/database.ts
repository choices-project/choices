/**
 * Polls Feature Database Types
 * 
 * Database type definitions for poll-related tables only.
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

export interface PollsDatabase {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          voting_method: string | null
          start_date: string | null
          end_date: string | null
          is_public: boolean | null
          allow_anonymous: boolean | null
          max_votes_per_user: number | null
          category: string | null
          tags: string[] | null
          hashtags: string[] | null
          primary_hashtag: string | null
          settings: Json | null
          total_votes: number | null
          participation_rate: number | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          voting_method?: string | null
          start_date?: string | null
          end_date?: string | null
          is_public?: boolean | null
          allow_anonymous?: boolean | null
          max_votes_per_user?: number | null
          category?: string | null
          tags?: string[] | null
          hashtags?: string[] | null
          primary_hashtag?: string | null
          settings?: Json | null
          total_votes?: number | null
          participation_rate?: number | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          voting_method?: string | null
          start_date?: string | null
          end_date?: string | null
          is_public?: boolean | null
          allow_anonymous?: boolean | null
          max_votes_per_user?: number | null
          category?: string | null
          tags?: string[] | null
          hashtags?: string[] | null
          primary_hashtag?: string | null
          settings?: Json | null
          total_votes?: number | null
          participation_rate?: number | null
        }
      }
      
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          option_id: string | null
          created_at: string | null
          updated_at: string | null
          is_anonymous: boolean | null
          weight: number | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          option_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_anonymous?: boolean | null
          weight?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          option_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_anonymous?: boolean | null
          weight?: number | null
          metadata?: Json | null
        }
      }
      
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          description: string | null
          order_index: number | null
          created_at: string | null
          updated_at: string | null
          vote_count: number | null
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          description?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
          vote_count?: number | null
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          description?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
          vote_count?: number | null
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
export type Poll = PollsDatabase['public']['Tables']['polls']['Row']
export type PollInsert = PollsDatabase['public']['Tables']['polls']['Insert']
export type PollUpdate = PollsDatabase['public']['Tables']['polls']['Update']

export type Vote = PollsDatabase['public']['Tables']['votes']['Row']
export type VoteInsert = PollsDatabase['public']['Tables']['votes']['Insert']
export type VoteUpdate = PollsDatabase['public']['Tables']['votes']['Update']

export type PollOption = PollsDatabase['public']['Tables']['poll_options']['Row']
export type PollOptionInsert = PollsDatabase['public']['Tables']['poll_options']['Insert']
export type PollOptionUpdate = PollsDatabase['public']['Tables']['poll_options']['Update']
