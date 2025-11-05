/**
 * @fileoverview Polls API
 * 
 * Poll management API providing poll creation, retrieval, and management
 * with features including auto-locking, moderation, and analytics.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

/**
 * Get polls with filtering and sorting
 * 
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.status] - Filter by poll status (active, closed, trending)
 * @param {string} [request.searchParams.category] - Filter by poll category
 * @param {string} [request.searchParams.hashtags] - Filter by hashtags (comma-separated)
 * @param {string} [request.searchParams.search] - Search in poll titles and descriptions
 * @param {string} [request.searchParams.sort] - Sort order (newest, popular, trending, engagement)
 * @param {number} [request.searchParams.limit] - Number of polls to return (default: 20)
 * @param {number} [request.searchParams.offset] - Number of polls to skip (default: 0)
 * @returns {Promise<NextResponse>} Poll data response
 * 
 * @example
 * GET /api/polls?status=trending&category=politics&sort=popular
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
    const sort = searchParams.get('sort') ?? 'newest';
    const includeHashtagData = searchParams.get('include_hashtag_data') === 'true';
    const includeAnalytics = searchParams.get('include_analytics') === 'true';
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');

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
      created_by
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

    // Fetch user profiles for polls that have created_by
    let userProfiles: Record<string, any> = {};
    if (polls && polls.length > 0) {
      const userIds = [...new Set((polls as any[]).map((poll: any) => poll.created_by).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name, is_admin')
          .in('user_id', userIds);
        
        if (!profilesError && profiles) {
          userProfiles = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }
    }

    // Get trending hashtags for analytics if needed (server-side query)
    let trendingHashtags: any[] = [];
    if (sort === 'trending' || status === 'trending' || includeAnalytics) {
      try {
        const { data: hashtagData, error: hashtagError } = await supabase
          .from('hashtags')
          .select('id, name, display_name, trend_score, usage_count, follower_count')
          .eq('is_trending', true)
          .order('trend_score', { ascending: false })
          .limit(10);
        
        if (!hashtagError && hashtagData) {
          trendingHashtags = (hashtagData as any[]).map((th: any) => ({
            hashtag: th,
            trend_score: th.trend_score ?? 0,
            growth_rate: 0, // Would need additional calculation
            peak_usage: th.usage_count ?? 0
          }));
        }
      } catch (error) {
        logger.warn('Failed to get trending hashtags:', { error: error instanceof Error ? error.message : 'Unknown error' });
        trendingHashtags = [];
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
          name: userProfiles[poll.created_by]?.display_name ?? userProfiles[poll.created_by]?.username ?? 'Anonymous',
          verified: userProfiles[poll.created_by]?.is_admin ?? false
        },
        status: poll.status,
        totalVotes: poll.total_votes ?? 0,
        createdAt: poll.created_at,
        endsAt: poll.end_date,
        tags: poll.tags ?? []
      };

      // Add hashtag data if available
      if (includeHashtagData && poll.hashtags) {
        (basePoll as any).hashtags = poll.hashtags;
        (basePoll as any).primary_hashtag = poll.primary_hashtag;
        (basePoll as any).hashtag_engagement = poll.hashtag_engagement;
      }

      // Calculate trending position if we have trending hashtags
      if (trendingHashtags.length > 0 && poll.hashtags) {
        const pollHashtags = poll.hashtags ?? [];
        const trendingPositions = pollHashtags
          .map((hashtag: string) => trendingHashtags.findIndex((th: any) => th.hashtag.name === hashtag) + 1)
          .filter((pos: number) => pos > 0);
        
        if (trendingPositions.length > 0) {
          (basePoll as any).trending_position = Math.min(...trendingPositions);
        }
      }

      return basePoll;
    }) ?? [];

    // Sort by trending if requested
    if (sort === 'trending') {
      transformedPolls = transformedPolls.sort((a, b) => {
        const aPos = (a as any).trending_position ?? 999;
        const bPos = (b as any).trending_position ?? 999;
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
 * Create a new poll
 * 
 * @param {NextRequest} request - Request object
 * @param {string} request.body.title - Poll title
 * @param {string} [request.body.description] - Poll description
 * @param {string} request.body.question - Poll question
 * @param {Array<string>} request.body.options - Poll options (minimum 2)
 * @param {string} [request.body.category] - Poll category (default: 'general')
 * @param {Array<string>} [request.body.tags] - Poll tags
 * @param {Object} [request.body.settings] - Poll settings
 * @returns {Promise<NextResponse>} Created poll data
 * 
 * @example
 * POST /api/polls
 * {
 *   "title": "Community Budget Vote",
 *   "question": "How should we allocate the budget?",
 *   "options": ["Education", "Healthcare", "Infrastructure"]
 * }
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

    // Create sophisticated poll with enhanced features
    const autoLockAt = settings?.autoLockDuration 
      ? new Date(Date.now() + settings.autoLockDuration * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() ?? '',
        question: question.trim(),
        category: category ?? 'general',
        tags: tags ?? [],
        created_by: user.id,
        status: 'active',
        visibility: 'public',
        
        // Sophisticated poll features
        auto_lock_at: autoLockAt,
        lock_duration: settings?.autoLockDuration ?? null,
        lock_type: settings?.autoLockDuration ? 'automatic' : null,
        moderation_status: settings?.requireModeration ? 'pending' : 'approved',
        privacy_level: settings?.privacyLevel ?? 'public',
        is_verified: false,
        is_featured: false,
        is_trending: false,
        trending_score: 0,
        engagement_score: 0,
        participation_rate: 0,
        total_views: 0,
        participation: 0,
        
        // Advanced settings
        poll_settings: {
          allow_anonymous: settings?.allowAnonymousVotes !== false,
          require_verification: settings?.requireVerification ?? false,
          auto_lock_duration: settings?.autoLockDuration ?? null,
          moderation_required: settings?.requireModeration ?? false,
          allow_multiple_votes: settings?.allowMultipleVotes ?? false,
          show_results_before_close: settings?.showResultsBeforeClose ?? false,
          allow_comments: settings?.allowComments !== false,
          allow_sharing: settings?.allowSharing !== false,
          require_authentication: settings?.requireAuthentication ?? false
        },
        settings: {
          allow_multiple_votes: settings?.allowMultipleVotes ?? false,
          allow_anonymous_votes: settings?.allowAnonymousVotes ?? true,
          show_results_before_close: settings?.showResultsBeforeClose ?? false,
          allow_comments: settings?.allowComments ?? true,
          allow_sharing: settings?.allowSharing !== false,
          require_authentication: settings?.requireAuthentication ?? false
        },
        metadata: metadata ?? {},
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
      text: option.text ?? option,
      description: option.description ?? '',
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

    // Track poll creation analytics
    const sessionId = crypto.randomUUID();
    const { data: analyticsEvent } = await supabase
      .from('analytics_events')
      .insert({
        event_type: 'poll_created',
        user_id: user.id,
        session_id: sessionId,
        event_data: {
          poll_id: poll.id,
          poll_title: poll.title,
          poll_category: poll.category,
          poll_settings: poll.poll_settings,
          auto_lock_at: poll.auto_lock_at,
          moderation_status: poll.moderation_status
        },
        ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Store detailed analytics data
    if (analyticsEvent) {
      await supabase
        .from('analytics_event_data')
        .insert([
          {
            event_id: analyticsEvent.id,
            data_key: 'poll_category',
            data_value: poll.category,
            data_type: 'string'
          },
          {
            event_id: analyticsEvent.id,
            data_key: 'poll_auto_lock',
            data_value: poll.auto_lock_at ? 'true' : 'false',
            data_type: 'boolean'
          },
          {
            event_id: analyticsEvent.id,
            data_key: 'poll_moderation_required',
            data_value: poll.moderation_status === 'pending' ? 'true' : 'false',
            data_type: 'boolean'
          }
        ]);
    }

    logger.info('Poll created successfully with analytics tracking', { 
      pollId: poll.id, 
      title: poll.title, 
      authorId: user.id,
      analyticsEventId: analyticsEvent?.id
    });

    return NextResponse.json({
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        status: poll.status,
        autoLockAt: poll.auto_lock_at,
        moderationStatus: poll.moderation_status,
        privacyLevel: poll.privacy_level,
        isVerified: poll.is_verified,
        isFeatured: poll.is_featured,
        engagementScore: poll.engagement_score,
        createdAt: poll.created_at
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('POST /api/polls error', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}