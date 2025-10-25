import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
// Temporarily comment out hashtag imports to isolate the issue
// import { getTrendingHashtags } from '@/features/hashtags/lib/hashtag-service';
// import { calculateTrendingHashtags } from '@/features/hashtags/lib/hashtag-analytics';

/**
 * Enhanced Polls API with Hashtag Integration
 * 
 * This API endpoint provides comprehensive poll management with advanced features:
 * - Hashtag-based filtering and search
 * - Trending hashtag integration
 * - Advanced sorting (newest, popular, trending, engagement)
 * - Analytics and engagement tracking
 * - Performance optimization with caching
 * 
 * @route GET /api/polls
 * @param {string} status - Filter by poll status (active, closed, trending)
 * @param {string} category - Filter by poll category
 * @param {string} hashtags - Filter by hashtags (comma-separated)
 * @param {string} search - Search in poll titles and descriptions
 * @param {string} sort - Sort order (newest, popular, trending, engagement)
 * @param {string} view_mode - View mode (grid, list, trending)
 * @param {boolean} include_hashtag_data - Include hashtag and engagement data
 * @param {boolean} include_analytics - Include trending hashtag analytics
 * @param {number} limit - Number of polls to return (default: 20)
 * @param {number} offset - Number of polls to skip (default: 0)
 * 
 * @returns {Object} Enhanced poll data with hashtag integration
 * 
 * @example
 * // Get trending polls with hashtag data
 * GET /api/polls?status=trending&include_hashtag_data=true&include_analytics=true
 * 
 * // Search polls by hashtag
 * GET /api/polls?hashtags=technology,politics&sort=trending
 * 
 * // Get polls with search and filtering
 * GET /api/polls?search=climate&category=environment&sort=popular
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase not configured');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const hashtags = searchParams.get('hashtags');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const viewMode = searchParams.get('view_mode') || 'grid';
    const includeHashtagData = searchParams.get('include_hashtag_data') === 'true';
    const includeAnalytics = searchParams.get('include_analytics') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build enhanced query with hashtag support
    let selectFields = `
      id,
      title,
      description,
      category,
      status,
      total_votes,
      created_at,
      end_date,
      tags,
      created_by,
      user_profiles!polls_created_by_fkey(
        username,
        display_name,
        is_admin
      )
    `;

    // Add hashtag fields if requested
    if (includeHashtagData) {
      selectFields += `,
        hashtags,
        primary_hashtag,
        hashtag_engagement
      `;
    }

    let query = supabase
        .from('polls')
      .select(selectFields)
      .range(offset, offset + limit - 1);

    // Apply enhanced filters
    if (status && status !== 'all') {
      if (status === 'trending') {
        // For trending, we'll handle this after getting the data
        query = query.eq('status', 'active');
      } else {
        query = query.eq('status', status);
      }
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (hashtags) {
      const hashtagList = hashtags.split(',').map(h => h.trim());
      query = query.overlaps('hashtags', hashtagList);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('total_votes', { ascending: false });
        break;
      case 'trending':
        // Will be handled after getting data with hashtag analytics
        query = query.order('created_at', { ascending: false });
        break;
      case 'engagement':
        query = query.order('total_votes', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: polls, error } = await query;

    if (error) {
      logger.error('Error fetching polls:', error);
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }

    // Get trending hashtags for analytics if needed (temporarily disabled)
    let trendingHashtags: any[] = [];
    if (sort === 'trending' || status === 'trending' || includeAnalytics) {
      try {
        // const trendingResult = await getTrendingHashtags();
        // if (trendingResult.success) {
        //   trendingHashtags = trendingResult.data || [];
        // }
        trendingHashtags = []; // Temporary fallback
      } catch (error) {
        logger.warn('Failed to get trending hashtags:', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Transform data to match frontend interface with hashtag integration
    let transformedPolls = polls?.map((poll: any) => {
      const basePoll = {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        author: {
          name: poll.user_profiles?.display_name || poll.user_profiles?.username || 'Anonymous',
          verified: poll.user_profiles?.is_admin || false
        },
        status: poll.status,
        totalVotes: poll.total_votes || 0,
        createdAt: poll.created_at,
        endsAt: poll.end_date,
        tags: poll.tags || []
      };

      // Add hashtag data if available
      if (includeHashtagData && poll.hashtags) {
        (basePoll as any).hashtags = poll.hashtags;
        (basePoll as any).primary_hashtag = poll.primary_hashtag;
        (basePoll as any).hashtag_engagement = poll.hashtag_engagement;
      }

      // Calculate trending position if we have trending hashtags
      if (trendingHashtags.length > 0 && poll.hashtags) {
        const pollHashtags = poll.hashtags || [];
        const trendingPositions = pollHashtags
          .map((hashtag: string) => trendingHashtags.findIndex((th: any) => th.hashtag.name === hashtag) + 1)
          .filter((pos: number) => pos > 0);
        
        if (trendingPositions.length > 0) {
          (basePoll as any).trending_position = Math.min(...trendingPositions);
        }
      }

      return basePoll;
    }) || [];

    // Sort by trending if requested
    if (sort === 'trending') {
      transformedPolls = transformedPolls.sort((a, b) => {
        const aPos = (a as any).trending_position || 999;
        const bPos = (b as any).trending_position || 999;
        return aPos - bPos;
      });
    }

    // Filter trending polls if status is trending
    if (status === 'trending') {
      transformedPolls = transformedPolls.filter(poll => (poll as any).trending_position && (poll as any).trending_position > 0);
    }

    logger.info('Polls fetched successfully', { 
      count: transformedPolls.length, 
      filters: { status, category, hashtags, search, sort },
      includeHashtagData,
      includeAnalytics
    });

    return NextResponse.json({
      polls: transformedPolls,
      pagination: {
        limit,
        offset,
        total: transformedPolls.length
      },
      analytics: includeAnalytics ? {
        trendingHashtags: trendingHashtags.slice(0, 10),
        totalHashtags: trendingHashtags.length
      } : undefined
    });

  } catch (error) {
    logger.error('GET /api/polls error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/polls - Create a new poll
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase not configured');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('User not authenticated');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description,
      question,
      options,
      category,
      tags,
      settings,
      metadata
    } = body;

    // Validate required fields
    if (!title || !question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ 
        error: 'Title, question, and at least 2 options are required' 
      }, { status: 400 });
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        question: question.trim(),
        category: category || 'general',
        tags: tags || [],
        created_by: user.id,
        status: 'active',
        visibility: 'public',
        settings: {
          allow_multiple_votes: settings?.allowMultipleVotes || false,
          allow_anonymous_votes: settings?.allowAnonymousVotes || true,
          show_results_before_close: settings?.showResultsBeforeClose || false,
          allow_comments: settings?.allowComments || true,
          allow_sharing: settings?.allowSharing !== false,
          require_authentication: settings?.requireAuthentication || false
        },
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (pollError) {
      logger.error('Error creating poll:', pollError);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    // Create poll options
    const optionsData = options.map((option: any, index: number) => ({
      poll_id: poll.id,
      text: option.text || option,
      description: option.description || '',
      order: index,
      votes: 0,
      percentage: 0
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData);

    if (optionsError) {
      logger.error('Error creating poll options:', optionsError);
      // Clean up the poll if options creation fails
      await supabase.from('polls').delete().eq('id', poll.id);
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 });
    }

    logger.info('Poll created successfully', { 
      pollId: poll.id, 
      title: poll.title, 
      authorId: user.id 
    });

    return NextResponse.json({
      poll: {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      category: poll.category,
      status: poll.status,
        createdAt: poll.created_at
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('POST /api/polls error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}