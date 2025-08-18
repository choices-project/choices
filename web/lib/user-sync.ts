import { createClient } from '@/utils/supabase/client'

export interface UserSyncResult {
  success: boolean
  userExists: boolean
  synced: boolean
  error?: string
  user?: any
}

/**
 * Ensures a user exists in both Supabase Auth and ia_users table
 * This bridges the gap between the two authentication systems
 */
export async function ensureUserSynced(): Promise<UserSyncResult> {
  try {
    const supabase = createClient()
    
    if (!supabase) {
      return {
        success: false,
        userExists: false,
        synced: false,
        error: 'Supabase client not available'
      }
    }

    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        userExists: false,
        synced: false,
        error: 'User not authenticated'
      }
    }

    // Check if user exists in ia_users table
    const { data: existingUser, error: checkError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return {
        success: false,
        userExists: true,
        synced: false,
        error: `Database error: ${checkError.message}`
      }
    }

    if (existingUser) {
      return {
        success: true,
        userExists: true,
        synced: true,
        user: existingUser
      }
    }

    // User doesn't exist in ia_users table, create them
    const { data: newUser, error: createError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: user.id,
        email: user.email,
        verification_tier: 'T0',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      return {
        success: false,
        userExists: true,
        synced: false,
        error: `Failed to create user record: ${createError.message}`
      }
    }

    return {
      success: true,
      userExists: true,
      synced: true,
      user: newUser
    }

  } catch (error) {
    return {
      success: false,
      userExists: false,
      synced: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get user from ia_users table by Supabase Auth user ID
 */
export async function getUserFromIaUsers(authUserId: string) {
  try {
    const supabase = createClient()
    
    if (!supabase) {
      return { data: null, error: 'Supabase client not available' }
    }

    const { data, error } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', authUserId)
      .single()

    return { data, error }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if user has completed onboarding (has a profile)
 */
export async function hasUserProfile(authUserId: string) {
  try {
    const supabase = createClient()
    
    if (!supabase) {
      return { hasProfile: false, error: 'Supabase client not available' }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', authUserId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { hasProfile: false, error: error.message }
    }

    return { hasProfile: !!data, error: null }
  } catch (error) {
    return {
      hasProfile: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

