/**
 * @fileoverview Feeds API
 * 
 * Feed management API providing poll feeds with filtering,
 * sorting, and engagement metrics.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get feed items
 * 
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.limit] - Number of items to return (default: 20)
 * @param {string} [request.searchParams.category] - Category filter (default: 'all')
 * @param {string} [request.searchParams.sort] - Sort order (trending, engagement, newest)
 * @param {string} [request.searchParams.district] - District filter (e.g., "CA-12")
 * @param {boolean} [request.searchParams.includeAnalytics] - Include analytics data
 * @returns {Promise<NextResponse>} Feed data response
 * 
 * @example
 * GET /api/feeds?limit=10&category=politics&sort=trending&district=CA-12
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit request per IP for feeds
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent');
    const rateLimitOptions: any = { maxRequests: 100, windowMs: 60 * 1000 };
    if (userAgent) rateLimitOptions.userAgent = userAgent;
    const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/feeds', rateLimitOptions);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabaseClient = await getSupabaseServerClient();
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const category = searchParams.get('category') ?? 'all';
    const district = searchParams.get('district');

    devLog('Fetching feed items (polls)...', { limit, category, district });

    // Fetch active polls with sophisticated engagement features
    const pollsQuery = (supabaseClient as any)
      .from('polls')
      .select(`
        id, 
        title, 
        description, 
        total_votes, 
        status, 
        created_at, 
        hashtags, 
        primary_hashtag,
        engagement_score,
        participation_rate,
        total_views,
        participation,
        is_trending,
        trending_score,
        is_featured,
        is_verified,
        auto_lock_at,
        moderation_status,
        privacy_level,
        poll_options(id, text, vote_count)
      `)
      .eq('status', 'active');

    // Note: Polls don't have district field directly. They're platform-wide.
    // District filtering will be applied to civic_actions below.

    const { data: polls, error: pollsError} = await pollsQuery
      .order('trending_score', { ascending: false })
      .order('engagement_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (pollsError) {
      devLog('Error fetching polls:', { error: pollsError });
      return NextResponse.json(
        { error: 'Failed to fetch feed items' },
        { status: 500 }
      );
    }

    // Fetch civic actions (district-specific content)
    let civicActionsQuery = (supabaseClient as any)
      .from('civic_actions')
      .select(`
        id,
        title,
        description,
        action_type,
        target_district,
        target_state,
        status,
        created_at,
        current_signatures,
        required_signatures
      `)
      .in('status', ['active', 'open']);

    // Apply district filter to civic actions
    if (district) {
      // Show civic actions for user's district OR platform-wide actions (null district)
      civicActionsQuery = civicActionsQuery.or(`target_district.eq.${district},target_district.is.null`);
    }

    const { data: civicActions, error: civicActionsError } = await civicActionsQuery
      .order('created_at', { ascending: false })
      .limit(10); // Include up to 10 civic actions

    if (civicActionsError) {
      devLog('Error fetching civic actions:', { error: civicActionsError });
      // Don't fail the entire request if civic actions fail
    }

    // Transform polls into feed items
    const pollFeedItems = (polls || []).map((poll: any) => ({
      id: poll.id,
      title: poll.title,
      content: poll.description || '',
      description: poll.description || '',
      summary: poll.description || '',
      author: {
        id: 'system',
        name: 'System',
        avatar: undefined,
        verified: true
      },
      category: 'poll',
      tags: poll.hashtags || [],
      type: 'poll' as const,
      source: {
        name: 'Choices Platform',
        url: '/',
        logo: undefined,
        verified: true
      },
      publishedAt: poll.created_at,
      updatedAt: poll.created_at,
      readTime: 1, // 1 minute for polls
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0,
        views: poll.total_votes || 0
      },
      userInteraction: {
        liked: false,
        shared: false,
        bookmarked: false,
        read: false
      },
      pollData: {
        id: poll.id,
        title: poll.title,
        options: poll.poll_options || [],
        totalVotes: poll.total_votes || 0,
        status: poll.status,
        primaryHashtag: poll.primary_hashtag
      },
      district: null // Polls are platform-wide
    }));

    // Transform civic actions into feed items
    const civicActionFeedItems = (civicActions || []).map((action: any) => ({
      id: action.id,
      title: action.title,
      content: action.description || '',
      description: action.description || '',
      summary: action.description || '',
      author: {
        id: 'system',
        name: 'Civic Action',
        avatar: undefined,
        verified: true
      },
      category: 'civic_action',
      tags: [action.action_type],
      type: 'civic_action' as const,
      source: {
        name: 'Choices Platform',
        url: '/',
        logo: undefined,
        verified: true
      },
      publishedAt: action.created_at,
      updatedAt: action.created_at,
      readTime: 2, // 2 minutes for civic actions
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0,
        views: action.current_signatures || 0
      },
      userInteraction: {
        liked: false,
        shared: false,
        bookmarked: false,
        read: false
      },
      civicActionData: {
        id: action.id,
        actionType: action.action_type,
        targetDistrict: action.target_district,
        targetState: action.target_state,
        currentSignatures: action.current_signatures || 0,
        requiredSignatures: action.required_signatures || 0,
        status: action.status
      },
      district: action.target_district // District-specific content
    }));

    // Combine and sort by date
    const feedItems = [...pollFeedItems, ...civicActionFeedItems]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    devLog('Feed items loaded:', { 
      polls: pollFeedItems.length,
      civicActions: civicActionFeedItems.length,
      total: feedItems.length,
      district 
    });

    return NextResponse.json({
      success: true,
      feeds: feedItems,
      count: feedItems.length,
      filters: {
        district: district || null
      },
      message: 'Feed items loaded successfully'
    });

  } catch (error) {
    devLog('Error in feeds API:', { error });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/feeds - Create or update feed items (for testing)
export async function POST(request: NextRequest) {
  try {
    // Category filtering not yet implemented
    // const _body = await request.json(); // Unused for now

    // For now, just return the same data as GET
    return GET(request);

  } catch (error) {
    devLog('Error in feeds POST API:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
