/**
 * Profile Auth Module
 * 
 * Authentication utilities for profile management
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Require a profile user (authenticated user with profile)
 */
export async function requireProfileUser() {
  const supabase = getSupabaseServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (profileError || !profile) {
    redirect('/onboarding');
  }
  
  return { user, profile };
}

/**
 * Validate profile data
 */
export function validateProfileData(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const profile = data as Record<string, unknown>;
  
  // Basic validation
  if (profile.name && typeof profile.name !== 'string') {
    return false;
  }
  
  if (profile.bio && typeof profile.bio !== 'string') {
    return false;
  }
  
  if (profile.location && typeof profile.location !== 'string') {
    return false;
  }
  
  return true;
}

export default {
  requireProfileUser,
  validateProfileData
};