import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      }
    })
  : null

// Database connection string for direct PostgreSQL access
export const DATABASE_URL = process.env.DATABASE_URL

// Helper function to get database connection
export const getDatabaseConnection = () => {
  if (!DATABASE_URL) {
    throw new Error('Missing DATABASE_URL environment variable')
  }
  return DATABASE_URL
}

// Database schema types (for type safety)
export interface Database {
  public: {
    Tables: {
      ia_users: {
        Row: {
          id: number
          stable_id: string
          email: string | null
          created_at: string
          updated_at: string
          verification_tier: string
          is_active: boolean
        }
        Insert: {
          id?: number
          stable_id: string
          email?: string | null
          created_at?: string
          updated_at?: string
          verification_tier?: string
          is_active?: boolean
        }
        Update: {
          id?: number
          stable_id?: string
          email?: string | null
          created_at?: string
          updated_at?: string
          verification_tier?: string
          is_active?: boolean
        }
      }
      ia_tokens: {
        Row: {
          id: number
          user_stable_id: string
          poll_id: string
          token_hash: string
          tag: string
          tier: string
          scope: string
          issued_at: string
          expires_at: string
          is_revoked: boolean
        }
        Insert: {
          id?: number
          user_stable_id: string
          poll_id: string
          token_hash: string
          tag: string
          tier: string
          scope: string
          issued_at?: string
          expires_at: string
          is_revoked?: boolean
        }
        Update: {
          id?: number
          user_stable_id?: string
          poll_id?: string
          token_hash?: string
          tag?: string
          tier?: string
          scope?: string
          issued_at?: string
          expires_at?: string
          is_revoked?: boolean
        }
      }
      po_polls: {
        Row: {
          id: number
          poll_id: string
          title: string
          description: string | null
          options: any
          created_at: string
          start_time: string
          end_time: string
          status: string
          sponsors: any
          ia_public_key: string
          total_votes: number
          participation_rate: number
        }
        Insert: {
          id?: number
          poll_id: string
          title: string
          description?: string | null
          options: any
          created_at?: string
          start_time: string
          end_time: string
          status?: string
          sponsors?: any
          ia_public_key: string
          total_votes?: number
          participation_rate?: number
        }
        Update: {
          id?: number
          poll_id?: string
          title?: string
          description?: string | null
          options?: any
          created_at?: string
          start_time?: string
          end_time?: string
          status?: string
          sponsors?: any
          ia_public_key?: string
          total_votes?: number
          participation_rate?: number
        }
      }
      po_votes: {
        Row: {
          id: number
          poll_id: string
          token: string
          tag: string
          choice: number
          voted_at: string
          merkle_leaf: string
          merkle_proof: any
        }
        Insert: {
          id?: number
          poll_id: string
          token: string
          tag: string
          choice: number
          voted_at?: string
          merkle_leaf: string
          merkle_proof?: any
        }
        Update: {
          id?: number
          poll_id?: string
          token?: string
          tag?: string
          choice?: number
          voted_at?: string
          merkle_leaf?: string
          merkle_proof?: any
        }
      }
    }
  }
}

// Typed Supabase client
export const typedSupabase = supabase as SupabaseClient<Database>

// Helper functions for common operations
export const supabaseHelpers = {
  // User operations
  async getUserByStableId(stableId: string) {
    const { data, error } = await typedSupabase
      .from('ia_users')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .eq('stable_id', stableId)
      .single()
    
    if (error) throw error
    return data
  },

  async createUser(user: Database['public']['Tables']['ia_users']['Insert']) {
    const { data, error } = await typedSupabase
      .from('ia_users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Poll operations
  async getPolls() {
    const { data, error } = await typedSupabase
      .from('po_polls')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getPoll(pollId: string) {
    const { data, error } = await typedSupabase
      .from('po_polls')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .eq('poll_id', pollId)
      .single()
    
    if (error) throw error
    return data
  },

  // Vote operations
  async createVote(vote: Database['public']['Tables']['po_votes']['Insert']) {
    const { data, error } = await typedSupabase
      .from('po_votes')
      .insert(vote)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getVotesForPoll(pollId: string) {
    const { data, error } = await typedSupabase
      .from('po_votes')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .eq('poll_id', pollId)
    
    if (error) throw error
    return data
  }
}
