import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  authError,
  notFoundError,
  errorResponse
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseServerClient()
  
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const supabaseClient = await supabase

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  
  if (userError || !user) {
    return authError('Not authenticated');
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('username, email, trust_tier, display_name, avatar_url, bio')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    logger.warn('User profile not found', { userId: user.id })
    return notFoundError('User profile not found');
  }

  const response = successResponse({
    user: {
      id: user.id,
      email: user.email,
      username: profile.username,
      trust_tier: profile.trust_tier,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
    }
  });

  response.headers.set('Cache-Control', 'no-store, max-age=0');

  return response;
});
