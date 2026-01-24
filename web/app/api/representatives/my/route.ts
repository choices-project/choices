import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    logger.error('Supabase client not available');
    return errorResponse('Service unavailable', 503);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return authError('Authentication required');
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  try {
    // Get followed representatives with full representative data
    // Use a simpler query first to check if the table exists
    // Make the join optional (left join) to handle missing representatives_core table
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
        representatives_core (
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
      // If table doesn't exist, RLS issue, or any error, return empty array instead of 500
      // This allows pages to load even if representatives feature isn't fully set up
      logger.warn('Representatives table not accessible or error occurred, returning empty list', {
        code: followedError.code,
        message: followedError.message,
      });
      return successResponse({
        representatives: [],
        total: 0,
        limit,
        offset,
        hasMore: false
      });
    }

    // Get total count
    const { count, error: countError } = await (supabase as any)
      .from('representative_follows')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      logger.warn('Error counting followed representatives (non-critical):', countError);
      // Don't fail the request if count fails - just use 0
    }

    // Transform data with type assertion for complex join
    // Filter out entries where the join failed (representatives_core is null)
    const representatives = (followed ?? [])
      .filter((follow: any) => follow.representatives_core != null)
      .map((follow: any) => ({
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
  } catch (error) {
    // Catch any unexpected errors and return empty array instead of 500
    // This ensures pages can still load even if there's an unexpected error
    logger.error('Unexpected error in /api/representatives/my:', error);
    return successResponse({
      representatives: [],
      total: 0,
      limit,
      offset,
      hasMore: false
    });
  }
});

