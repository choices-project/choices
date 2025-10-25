/**
 * Enhanced Profile Authentication Utilities
 * 
 * Superior implementation using Supabase native sessions throughout
 * Eliminates authentication chaos by providing unified approach
 * 
 * Created: January 27, 2025
 * Status: ✅ SUPERIOR IMPLEMENTATION
 */

import { getSupabaseBrowserClient } from '@/utils/supabase/client';

// Types for superior implementation
export interface ProfileUser {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileAuthResult {
  user: ProfileUser;
  supabase: any;
}

export interface ProfileAuthError {
  error: string;
  code: 'UNAUTHORIZED' | 'INVALID_SESSION' | 'USER_NOT_FOUND' | 'SUPABASE_ERROR';
  details?: any;
}

/**
 * Get Supabase client with proper configuration
 * Superior implementation using centralized utilities
 */
export async function getSupabaseClient() {
  return await getSupabaseBrowserClient();
}


/**
 * Get current authenticated user with profile data
 * Superior implementation using Supabase native sessions
 */
export async function getCurrentProfileUser(): Promise<ProfileUser | null> {
  try {
    const supabase = await getSupabaseClient();
    
    // Get current user from Supabase session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('username, display_name, trust_tier, created_at, updated_at, email, avatar_url, is_admin, is_active')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, create a basic one
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'User',
          trust_tier: 'T0',
          is_admin: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user profile:', createError);
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        username: newProfile.username,
        display_name: newProfile.display_name || undefined,
        trust_tier: newProfile.trust_tier as 'T0' | 'T1' | 'T2' | 'T3',
        is_admin: false,
        is_active: true,
        created_at: newProfile.created_at || new Date().toISOString(),
        updated_at: newProfile.updated_at || new Date().toISOString(),
      };
    }

    // Check if user is admin by checking the profile
    const isAdmin = profile.is_admin || false;

    return {
      id: user.id,
      email: profile.email || user.email || '',
      username: profile.username,
      display_name: profile.display_name || undefined,
      trust_tier: profile.trust_tier as 'T0' | 'T1' | 'T2' | 'T3',
      is_admin: !!isAdmin,
      is_active: profile.is_active ?? true,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
    };

  } catch (error) {
    console.error('Error getting current profile user:', error);
    return null;
  }
}

/**
 * Require authenticated user for profile operations
 * Superior implementation with proper error handling
 */
export async function requireProfileUser(): Promise<ProfileAuthResult | ProfileAuthError> {
  try {
    const user = await getCurrentProfileUser();
    
    if (!user) {
      return {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      };
    }

    const supabase = await getSupabaseClient();
    
    return {
      user,
      supabase,
    };

  } catch (error) {
    console.error('Error requiring profile user:', error);
    return {
      error: 'Authentication error',
      code: 'SUPABASE_ERROR',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate profile data
 * Superior implementation with comprehensive validation
 */
export function validateProfileData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.display_name && (typeof data.display_name !== 'string' || data.display_name.length > 100)) {
    errors.push('Display name must be a string with max 100 characters');
  }

  if (data.bio && (typeof data.bio !== 'string' || data.bio.length > 500)) {
    errors.push('Bio must be a string with max 500 characters');
  }

  if (data.username && (typeof data.username !== 'string' || !/^[a-zA-Z0-9_]+$/.test(data.username))) {
    errors.push('Username must contain only letters, numbers, and underscores');
  }

  if (data.trust_tier && !['T0', 'T1', 'T2', 'T3'].includes(data.trust_tier)) {
    errors.push('Trust tier must be T0, T1, T2, or T3');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}