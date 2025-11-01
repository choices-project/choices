/**
 * My Representatives API Endpoint
 * 
 * Returns all representatives that the authenticated user is following
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/representatives/my
 * Get all representatives the user is following
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Get followed representatives with full representative data
    const { data: followed, error: followedError } = await supabase
      .from('user_followed_representatives')
      .select(`
        *,
        representatives_core (
          *,
          representative_photos(*),
          representative_contacts(*),
          representative_social_media(*),
          representative_activity(*),
          representative_committees(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (followedError) {
      logger.error('Error fetching followed representatives:', followedError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch followed representatives' },
        { status: 500 }
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('user_followed_representatives')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      logger.error('Error counting followed representatives:', countError);
    }

    // Transform data to include both follow metadata and representative data
    const representatives = (followed ?? []).map((follow) => ({
      follow: {
        id: follow.id,
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

    return NextResponse.json({
      success: true,
      data: {
        representatives,
        total: count ?? 0,
        limit,
        offset,
        hasMore: (count ?? 0) > offset + limit
      }
    });

  } catch (error) {
    logger.error('Unexpected error in my representatives endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

