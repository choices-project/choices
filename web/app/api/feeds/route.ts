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
 * @param {boolean} [request.searchParams.includeAnalytics] - Include analytics data
 * @returns {Promise<NextResponse>} Feed data response
 * 
 * @example
 * GET /api/feeds?limit=10&category=politics&sort=trending
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit request per IP for feeds
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent') ?? undefined;
    const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/feeds', { maxRequests: 100, windowMs: 60 * 1000, userAgent });
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

    devLog('Fetching feed items (polls)...', { limit, category });

    // Fetch active polls with sophisticated engagement features
    const { data: polls, error: pollsError } = await (supabaseClient as any)
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
      .eq('status', 'active')
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

    // Transform polls into feed items
    const feedItems = (polls || []).map((poll: any) => ({
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
      }
    }));

    devLog('Feed items loaded:', { count: feedItems.length });

    return NextResponse.json({
      success: true,
      feeds: feedItems,
      count: feedItems.length,
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
