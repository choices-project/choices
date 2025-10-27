/**
 * Database Types
 * 
 * Type definitions for the database schema
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          updated_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          question: string
          description?: string
          created_at: string
          updated_at: string
          created_by: string
          is_public: boolean
          is_shareable: boolean
        }
        Insert: {
          id?: string
          question: string
          description?: string
          created_at?: string
          updated_at?: string
          created_by: string
          is_public?: boolean
          is_shareable?: boolean
        }
        Update: {
          id?: string
          question?: string
          description?: string
          updated_at?: string
          is_public?: boolean
          is_shareable?: boolean
        }
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          text?: string
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          option_id: string
          user_id?: string
          voter_session?: string
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          option_id: string
          user_id?: string
          voter_session?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          voter_session?: string
        }
      }
      hashtags: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          bio?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          bio?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          bio?: string
          updated_at?: string
        }
      }
      trust_tier_analytics: {
        Row: {
          id: string
          user_id: string
          trust_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trust_tier: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trust_tier?: string
          updated_at?: string
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
  }
}
