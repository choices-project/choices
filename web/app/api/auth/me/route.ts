import {
  withErrorHandling,
  successResponse,
  authError,
  notFoundError,
  errorResponse
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseServerClient()
  
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const supabaseClient = await supabase

  // Get current user session
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
  
  if (sessionError || !session?.user) {
    return authError('Not authenticated');
  }

  // Get user profile from user_profiles table
  const { data: profile, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('username, email, trust_tier, display_name, avatar_url, bio, is_active')
    .eq('user_id', session.user.id)
    .single()

  if (profileError || !profile) {
    logger.warn('User profile not found', { userId: session.user.id })
    return notFoundError('User profile not found');
  }

  return successResponse({
    id: session.user.id,
    email: session.user.email,
    username: profile.username,
    trust_tier: profile.trust_tier,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    is_active: profile.is_active
  });
});
