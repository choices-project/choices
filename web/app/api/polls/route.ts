/**
 * @fileoverview Polls API
 *
 * Poll management API providing poll creation, retrieval, and management
 * with features including auto-locking, moderation, and analytics.
 *
 * Updated: November 6, 2025 - Modernized with standardized responses
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 3.0.0
 * @since 1.0.0
 */

import type { NextRequest } from 'next/server';

import {
  withErrorHandling,
  successResponse,
  authError,
  errorResponse
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import type { Hashtag, PollHashtagIntegration } from '@/features/hashtags/types';

const buildPollHashtagIntegration = (poll: any): PollHashtagIntegration | undefined => {
  if (!poll.hashtags) {
    return undefined;
  }

  const hashtags: string[] = Array.isArray(poll.hashtags)
    ? poll.hashtags.filter((tag: unknown): tag is string => typeof tag === 'string')
    : [];

  const primaryHashtag = typeof poll.primary_hashtag === 'string' ? poll.primary_hashtag : undefined;
  const engagement = poll.hashtag_engagement ?? null;

  if (!hashtags.length && !primaryHashtag && !engagement) {
    return undefined;
  }

  return {
    poll_id: poll.id,
    hashtags,
    primary_hashtag: primaryHashtag,
    hashtag_engagement: {
      total_views: engagement?.total_views ?? 0,
      hashtag_clicks: engagement?.hashtag_clicks ?? 0,
      hashtag_shares: engagement?.hashtag_shares ?? 0,
    },
    related_polls: Array.isArray(poll.related_polls)
      ? poll.related_polls.filter((id: unknown): id is string => typeof id === 'string')
      : [],
    hashtag_trending_score: poll.hashtag_trending_score ?? 0,
  };
};

const mapPollRecord = (
  poll: any,
  authorProfiles: Record<string, any>,
  includeHashtagData: boolean,
  trendingHashtags: Array<{ hashtag: Hashtag }>,
): Record<string, unknown> => {
  const basePoll: Record<string, unknown> = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    category: poll.category,
    status: poll.status,
    totalVotes: poll.total_votes ?? 0,
    createdAt: poll.created_at,
    endsAt: poll.end_date,
    tags: Array.isArray(poll.tags)
      ? poll.tags.filter((tag: unknown): tag is string => typeof tag === 'string')
      : [],
    author: {
      name: authorProfiles[poll.created_by]?.display_name ?? authorProfiles[poll.created_by]?.username ?? 'Anonymous',
      verified: authorProfiles[poll.created_by]?.is_admin ?? false,
    },
  };

  if (includeHashtagData) {
    const integration = buildPollHashtagIntegration(poll);
    if (integration) {
      basePoll.hashtags = integration.hashtags;
      basePoll.primary_hashtag = integration.primary_hashtag;
      basePoll.hashtagIntegration = integration;
    }
  }

  if (trendingHashtags.length > 0 && Array.isArray(poll.hashtags)) {
    const positions = poll.hashtags
      .map((hashtag: string) => trendingHashtags.findIndex((th) => th.hashtag.name === hashtag) + 1)
      .filter((position: number) => position > 0);

    if (positions.length > 0) {
      basePoll.trending_position = Math.min(...positions);
    }
  }

  return basePoll;
};

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
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Database not available', 500);
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
      return errorResponse('Failed to fetch polls', 500);
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
    let trendingHashtags: Array<{ hashtag: Hashtag }> = [];
    if (sort === 'trending' || status === 'trending' || includeAnalytics) {
      try {
        const { data: hashtagData, error: hashtagError } = await supabase
          .from('hashtags')
          .select(
            [
              'id',
              'name',
              'description',
              'category',
              'metadata',
              'is_trending',
              'is_verified',
              'is_featured',
              'trending_score',
              'usage_count',
              'follower_count',
              'created_at',
              'updated_at',
            ].join(','),
          )
          .eq('is_trending', true)
          .order('trending_score', { ascending: false })
          .limit(10);

        if (!hashtagError && Array.isArray(hashtagData)) {
          trendingHashtags = hashtagData.map((row) => {
            const raw = row as unknown as Record<string, unknown>;
            const metadataValue = raw.metadata;
            const metadata =
              metadataValue && typeof metadataValue === 'object'
                ? (metadataValue as Record<string, unknown>)
                : undefined;
            const baseDisplayName =
              metadata && typeof metadata.display_name === 'string'
                ? (metadata.display_name as string)
                : typeof raw.name === 'string'
                ? (raw.name as string)
                : '';

            const hashtag: Hashtag = {
              id: String(raw.id),
              name: typeof raw.name === 'string' ? (raw.name as string) : '',
              display_name:
                baseDisplayName || (typeof raw.name === 'string' ? (raw.name as string) : String(raw.id ?? '')),
              category: (raw.category ?? 'custom') as Hashtag['category'],
              usage_count: typeof raw.usage_count === 'number' ? (raw.usage_count as number) : 0,
              is_trending: Boolean(raw.is_trending),
              is_verified: Boolean(raw.is_verified),
              created_at: typeof raw.created_at === 'string' ? (raw.created_at as string) : new Date().toISOString(),
              updated_at:
                typeof raw.updated_at === 'string'
                  ? (raw.updated_at as string)
                  : typeof raw.created_at === 'string'
                    ? (raw.created_at as string)
                    : new Date().toISOString(),
            };

            if (typeof raw.description === 'string') {
              hashtag.description = raw.description as string;
            }
            if (typeof raw.is_featured === 'boolean') {
              hashtag.is_featured = raw.is_featured as boolean;
            }
            if (typeof raw.follower_count === 'number') {
              hashtag.follower_count = raw.follower_count as number;
            }
            if (typeof raw.trending_score === 'number') {
              hashtag.trend_score = raw.trending_score as number;
            }
            if (metadata) {
              hashtag.metadata = metadata;
            }

            return { hashtag };
          });
        }
      } catch (error) {
        logger.warn('Failed to get trending hashtags:', { error: error instanceof Error ? error.message : 'Unknown error' });
        trendingHashtags = [];
      }
    }

    const transformedPolls = (polls ?? []).map((poll) =>
      mapPollRecord(poll, userProfiles, includeHashtagData, trendingHashtags)
    );

    if (sort === 'trending') {
      transformedPolls.sort((a, b) => {
        const aPos = (a as Record<string, unknown>).trending_position as number | undefined ?? 999;
        const bPos = (b as Record<string, unknown>).trending_position as number | undefined ?? 999;
        return aPos - bPos;
      });
    }

    const filteredPolls =
      status === 'trending'
        ? transformedPolls.filter(
            (poll) =>
              ((poll as Record<string, unknown>).trending_position as number | undefined ?? 0) > 0,
          )
        : transformedPolls;

    logger.info('Polls fetched successfully', {
      count: filteredPolls.length,
      filters: { status, category, hashtags, search, sort },
      includeHashtagData,
      includeAnalytics,
    });

    return successResponse(
      {
        polls: filteredPolls,
        analytics:
          includeAnalytics
            ? {
                trendingHashtags: trendingHashtags.slice(0, 10),
                totalHashtags: trendingHashtags.length,
              }
            : undefined,
      },
      {
        pagination: {
          limit,
          offset,
          total: filteredPolls.length,
          hasMore: filteredPolls.length === limit,
        },
      },
    );
});

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
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Database not available', 500);
  }

  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    logger.warn('User not authenticated');
    return authError('Authentication required');
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

    const resolveVotingMethod = () => {
      const method = (metadata?.votingMethod ?? settings?.votingMethod ?? 'single')
        .toString()
        .toLowerCase();
      switch (method) {
        case 'single':
        case 'single_choice':
          return 'single_choice';
        case 'multiple':
        case 'multiple_choice':
          return 'multiple_choice';
        case 'ranked':
        case 'ranked_choice':
          return 'ranked_choice';
        case 'approval':
          return 'approval';
        case 'quadratic':
          return 'quadratic';
        default:
          return 'single_choice';
      }
    };

    const normalizedVotingMethod = resolveVotingMethod();

    // Validate required fields
    if (!title || !question || !options || !Array.isArray(options) || options.length < 2) {
      return errorResponse(
        'Title, question, and at least 2 options are required',
        400,
        { title: !title, question: !question, options: !options || options.length < 2 },
        'VALIDATION_ERROR'
      );
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
        voting_method: normalizedVotingMethod,

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
          max_selections: metadata?.maxSelections ?? settings?.maxSelections ?? null,
          voting_method: normalizedVotingMethod,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (pollError) {
      logger.error('Error creating poll:', pollError);
      return errorResponse('Failed to create poll', 500, pollError.message);
    }

    // Create poll options
    const optionsData = options.map((option: any, index: number) => {
      const text = typeof option === 'string' ? option : option?.text ?? '';
      return {
        poll_id: poll.id,
        text,
        option_text: text,
        order_index: index,
        vote_count: 0,
      };
    });

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData);

    if (optionsError) {
      logger.error('Error creating poll options:', optionsError);
      // Clean up the poll if options creation fails
      await supabase.from('polls').delete().eq('id', poll.id);
      return errorResponse('Failed to create poll options', 500, optionsError.message);
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
      await (supabase as any)
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

    return successResponse({
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
    }, undefined, 201);
});
