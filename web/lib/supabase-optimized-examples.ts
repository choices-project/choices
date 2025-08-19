
// Optimized Supabase Query Examples
// Use these patterns to avoid warnings and improve performance

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. Specific field selection (instead of select('*'))
export async function getOptimizedUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('ia_users')
    .select('stable_id, verification_tier, is_active, created_at')
    .eq('stable_id', userId)
    .single();

  if (error) {
    logger.error('Failed to get user profile', error);
    return { error: error.message };
  }

  return { data };
}

// 2. Batch operations for better performance
export async function getOptimizedPolls(limit = 20) {
  const { data, error } = await supabase
    .from('po_polls')
    .select('poll_id, title, status, total_votes, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to get polls', error);
    return { error: error.message };
  }

  return { data };
}

// 3. Efficient feedback queries
export async function getOptimizedFeedback(status?: string) {
  let query = supabase
    .from('feedback')
    .select('id, type, title, status, priority, created_at')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to get feedback', error);
    return { error: error.message };
  }

  return { data };
}

// 4. Admin queries with proper pagination
export async function getOptimizedAdminStats() {
  const { data, error, count } = await supabase
    .from('feedback')
    .select('id, status, priority', { count: 'exact' })
    .limit(1000);

  if (error) {
    logger.error('Failed to get admin stats', error);
    return { error: error.message };
  }

  return { data, count };
}

// 5. Connection optimization
export function getOptimizedSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  );
}
