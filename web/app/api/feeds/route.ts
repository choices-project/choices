import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/feeds - Get feed items (polls) for the UnifiedFeed component
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = await getSupabaseServerClient();
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || 'all';

    devLog('Fetching feed items (polls)...', { limit, category });

    // Fetch active polls from polls table
    const { data: polls, error: pollsError } = await (supabaseClient as any)
      .from('polls')
      .select('id, title, description, options, total_votes, status, created_at, hashtags, primary_hashtag')
      .eq('status', 'active')
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
        options: poll.options,
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
    const body = await request.json();
    const { category } = body;

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
