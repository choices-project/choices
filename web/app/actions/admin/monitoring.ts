'use server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { upstashRateLimiter } from '@/lib/rate-limiting/upstash-rate-limiter';
import { logger } from '@/lib/utils/logger';

/**
 * Clear rate limit for a specific IP and endpoint
 * 
 * Server action for clearing rate limits from monitoring page
 * Only accessible to authenticated admin users
 */
export async function clearRateLimit(ip: string, endpoint: string) {
  try {
    // Verify user is authenticated and has admin role
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user has admin role (you may need to adjust this based on your role system)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      throw new Error('Admin access required');
    }

    // Clear the rate limit
    const ok = await upstashRateLimiter.clearRateLimit(ip, endpoint);
    logger.info('Rate limit cleared by admin', {
      adminId: user.id,
      ip,
      endpoint,
      success: ok
    });

    return { success: ok, error: null };
  } catch (error) {
    logger.error('Failed to clear rate limit', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
      endpoint
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear rate limit'
    };
  }
}

