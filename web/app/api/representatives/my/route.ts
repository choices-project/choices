import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return authError('Authentication required');
  }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get followed representatives with full representative data
    const { data: followed, error: followedError } = await (supabase as any)
      .from('representative_follows')
      .select(`
        id,
        user_id,
        notify_on_votes,
        notify_on_committee_activity,
        notify_on_public_statements,
        notify_on_events,
        notes,
        tags,
        created_at,
        updated_at,
        representatives_core!inner (
          id,
          name,
          party,
          office,
          level,
          state,
          district,
          primary_email,
          primary_phone,
          primary_website
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

  if (followedError) {
    logger.error('Error fetching followed representatives:', followedError);
    return errorResponse('Failed to fetch followed representatives', 500);
  }

    // Get total count
    const { count, error: countError } = await (supabase as any)
      .from('representative_follows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      logger.error('Error counting followed representatives:', countError);
    }

    // Transform data with type assertion for complex join
    const representatives = (followed ?? []).map((follow: any) => ({
      follow: {
        id: follow.id,
        user_id: follow.user_id,
        notify_on_votes: follow.notify_on_votes,
        notify_on_committee_activity: follow.notify_on_committee_activity,
        notify_on_public_statements: follow.notify_on_public_statements,
        notify_on_events: follow.notify_on_events,
        notes: follow.notes,
        tags: follow.tags,
        created_at: follow.created_at,
        updated_at: follow.updated_at
      },
      representative: follow.representatives_core
    }));

  return successResponse({
    representatives,
    total: count ?? 0,
    limit,
    offset,
    hasMore: (count ?? 0) > offset + limit
  });
});

