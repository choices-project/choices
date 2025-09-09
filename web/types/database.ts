/**
 * Database schema types for Supabase
 * Generated from our clean schema migration
 * 
 * This file contains the exact TypeScript interfaces that match our database schema.
 * These types ensure type safety when working with Supabase operations.
 */

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          email: string | null
          trust_tier: 'T0' | 'T1' | 'T2' | 'T3'
          created_at: string
          updated_at: string
          avatar_url: string | null
          bio: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          email?: string | null
          trust_tier?: 'T0' | 'T1' | 'T2' | 'T3'
          created_at?: string
          updated_at?: string
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          email?: string | null
          trust_tier?: 'T0' | 'T1' | 'T2' | 'T3'
          created_at?: string
          updated_at?: string
          avatar_url?: string | null
          bio?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          options: string[]
          voting_method: string
          created_by: string
          created_at: string
          updated_at: string
          start_time: string
          end_time: string
          status: 'draft' | 'active' | 'closed' | 'archived'
          privacy_level: 'public' | 'private' | 'high-privacy'
          total_votes: number
          category: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          options: string[]
          voting_method: string
          created_by: string
          created_at?: string
          updated_at?: string
          start_time: string
          end_time: string
          status?: 'draft' | 'active' | 'closed' | 'archived'
          privacy_level?: 'public' | 'private' | 'high-privacy'
          total_votes?: number
          category?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          options?: string[]
          voting_method?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          start_time?: string
          end_time?: string
          status?: 'draft' | 'active' | 'closed' | 'archived'
          privacy_level?: 'public' | 'private' | 'high-privacy'
          total_votes?: number
          category?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          selected_options: string[]
          created_at: string
          updated_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          selected_options: string[]
          created_at?: string
          updated_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          selected_options?: string[]
          created_at?: string
          updated_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      error_logs: {
        Row: {
          id: string
          user_id: string | null
          error_type: string
          error_message: string
          stack_trace: string | null
          context: any | null
          created_at: string
          severity: 'low' | 'medium' | 'high' | 'critical'
        }
        Insert: {
          id?: string
          user_id?: string | null
          error_type: string
          error_message: string
          stack_trace?: string | null
          context?: any | null
          created_at?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
        }
        Update: {
          id?: string
          user_id?: string | null
          error_type?: string
          error_message?: string
          stack_trace?: string | null
          context?: any | null
          created_at?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

// Convenience types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type UserProfile = Tables<'user_profiles'>
export type Poll = Tables<'polls'>
export type Vote = Tables<'votes'>
export type ErrorLog = Tables<'error_logs'>

// Insert types
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type PollInsert = Database['public']['Tables']['polls']['Insert']
export type VoteInsert = Database['public']['Tables']['votes']['Insert']
export type ErrorLogInsert = Database['public']['Tables']['error_logs']['Insert']

// Update types
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type PollUpdate = Database['public']['Tables']['polls']['Update']
export type VoteUpdate = Database['public']['Tables']['votes']['Update']
export type ErrorLogUpdate = Database['public']['Tables']['error_logs']['Update']
