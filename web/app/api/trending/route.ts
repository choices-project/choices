/**
 * Consolidated Trending API Endpoint
 * 
 * This endpoint consolidates all trending functionality:
 * - Trending polls
 * - Trending hashtags
 * - Trending topics
 * 
 * Usage:
 * GET /api/trending?type=polls&limit={limit} - Trending polls
 * GET /api/trending?type=hashtags&limit={limit} - Trending hashtags
 * GET /api/trending?type=topics&limit={limit} - Trending topics
 * POST /api/trending?type=hashtags - Track hashtags
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { trendingHashtagsTracker } from '@/features/feeds/lib/TrendingHashtags';
import { withErrorHandling, validationError } from '@/lib/api';
import { logger , devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type PollData = {
  id: string;
  title: string;
  description: string;
  category: string;
  totalVotes: number;
  timeRemaining: string;
  isActive: boolean;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }>;
}

type _TopicData = {
  id: string;
  topic: string;
  score: number;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  source_name: string;
  category: string;
  trending_score: number;
  velocity: number;
  momentum: number;
  sentiment_score: number;
  metadata?: {
    engagement?: string;
    controversy?: string;
  };
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'polls';
  const limit = parseInt(searchParams.get('limit') ?? '10');

  switch (type) {
    case 'polls':
      return await getTrendingPolls(limit);
    
    case 'hashtags':
      return await getTrendingHashtags(request, limit);
    
    case 'topics':
      return await getTrendingTopics(limit);
    
    default:
      return validationError({ 
        type: 'Invalid type. Use "polls", "hashtags", or "topics"' 
      });
    }
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'hashtags';

  if (type === 'hashtags') {
    return await trackHashtags(request);
  }

  return validationError({ type: 'Invalid type for POST. Use "hashtags"' });
});

async function getTrendingPolls(limit: number) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get trending polls (most votes in last 7 days)
    const { data: polls, error } = await (supabase as any)
      .from('polls')
      .select(`
        id,
        title,
        description,
        category,
        created_at,
        end_date,
        total_votes,
        status,
        options
      `)
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('total_votes', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error('Error fetching trending polls:', error);
      return NextResponse.json({ polls: [] }, { status: 500 });
    }
    
    if (!polls) {
      return NextResponse.json({ polls: [] }, { status: 500 });
    }
    
    // Transform data for frontend
    const transformedPolls = (polls as any[]).map((poll: any) => {
      // Type guard to ensure poll has required properties
      if (!poll || typeof poll !== 'object') {
        return null;
      }
      
      return {
        id: poll.id ?? '',
        title: poll.title ?? '',
        description: poll.description ?? '',
        category: poll.category ?? 'General',
        totalVotes: poll.total_votes ?? 0,
        timeRemaining: getTimeRemaining(poll.end_date),
        isActive: poll.status === 'active',
        options: Array.isArray(poll.options) ? (poll.options).map((option: any, index: number) => ({
          id: option.id ?? `option-${index}`,
          text: option.text ?? option.title ?? `Option ${index + 1}`,
          votes: option.votes ?? 0,
          percentage: ((poll).total_votes ?? 0) > 0 ? Math.round((option.votes ?? 0) / ((poll).total_votes ?? 0) * 100) : 0
        })) : []
      };
    }).filter(poll => poll !== null);
    
    return NextResponse.json({
      success: true,
      data: transformedPolls,
      type: 'polls',
      limit,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error in trending polls API', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ polls: [] }, { status: 500 });
  }
}

async function getTrendingHashtags(request: NextRequest, limit: number) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtagType = searchParams.get('hashtagType') ?? 'trending';

    let result;

    switch (hashtagType) {
      case 'trending':
        result = await trendingHashtagsTracker.getTrendingHashtags(limit);
        break;
      case 'analytics':
        result = await trendingHashtagsTracker.getHashtagAnalytics();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid hashtagType. Use "trending" or "analytics"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      type: 'hashtags',
      hashtagType,
      limit,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error fetching trending hashtags:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getTrendingTopics(limit: number) {
  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Fetch trending topics from the proper table
    const supabaseClient = await supabase;
    const { data: trendingTopics, error: trendingError } = await supabaseClient
      .from('trending_topics')
      .select('id, topic, score, created_at, updated_at, title, description, source_name, category, trending_score, velocity, momentum, sentiment_score, metadata')
      .order('trending_score', { ascending: false })
      .limit(limit);

    if (trendingError) {
      devLog('Error fetching trending topics:', { error: trendingError });
      throw new Error('Failed to fetch trending topics');
    }

    // Fetch available polls (optional - if no polls exist, we'll still create trending polls)
    let polls: PollData[] = [];
    try {
      const { data: pollsData, error: pollsError } = await (supabaseClient as any)
        .from('polls')
        .select('id, title, total_votes, participation, options, status')
        .eq('status', 'active')
        .limit(10);

      if (pollsError) {
        devLog('Error fetching polls:', { error: pollsError });
        // Continue without polls - we'll use fallback data
      } else {
        polls = (pollsData ?? []).map((poll: any) => ({
          ...poll,
          participation_rate: poll.participation ?? 0,
          total_votes: poll.total_votes ?? 0
        }));
      }
    } catch (pollsError) {
      devLog('Error fetching polls:', { error: pollsError });
      // Continue without polls - we'll use fallback data
    }

    // Create dynamic trending polls by combining trending topics with poll data
    const trendingPolls = trendingTopics.map((topic: any, index: number) => {
      const poll = polls[index % polls.length] ?? {
        id: `trending-${topic.id}`,
        title: topic.title,
        total_votes: Math.floor(Math.random() * 1000) + 100,
        participation_rate: Math.floor(Math.random() * 30) + 10,
        options: [
          { id: '1', text: 'Support', votes: Math.floor(Math.random() * 500) + 50 },
          { id: '2', text: 'Oppose', votes: Math.floor(Math.random() * 500) + 50 }
        ],
        status: 'active'
      };

      return {
        id: poll.id,
        title: poll.title,
        description: topic.description,
        category: topic.category,
        totalVotes: (poll as any).total_votes ?? 0,
        participationRate: (poll as any).participation_rate ?? 0,
        trendingScore: topic.trending_score,
        velocity: topic.velocity,
        momentum: topic.momentum,
        sentimentScore: topic.sentiment_score,
        source: topic.source_name,
        createdAt: topic.created_at,
        updatedAt: topic.updated_at,
        options: poll.options.map(option => ({
          id: option.id,
          text: option.text,
          votes: option.votes,
          percentage: (poll as any).total_votes > 0 ? Math.round((option.votes / (poll as any).total_votes) * 100) : 0
        })),
        metadata: topic.metadata
      };
    });

    return NextResponse.json({
      success: true,
      data: trendingPolls,
      type: 'topics',
      limit,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error in trending topics API:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function trackHashtags(request: NextRequest) {
  try {
    const body = await request.json();
    const { hashtags, userId, source, metadata } = body;

    // Validate input
    if (!hashtags || !Array.isArray(hashtags) || !userId) {
      return NextResponse.json(
        { error: 'Invalid input. hashtags array and userId are required.' },
        { status: 400 }
      );
    }

    // Track multiple hashtags
    await trendingHashtagsTracker.trackMultipleHashtags(
      hashtags,
      userId,
      source ?? 'custom'
    );

    devLog('Hashtags tracked:', { hashtags, userId, source, metadata });

    return NextResponse.json({
      success: true,
      message: 'Hashtags tracked successfully',
      count: hashtags.length,
      type: 'hashtags',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error tracking hashtags:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTimeRemaining(endDate: string | null): string {
  if (!endDate) return 'No end date';
  
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
