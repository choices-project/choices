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

import { z } from 'zod';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import type { Hashtag, PollHashtagIntegration } from '@/features/hashtags/types';


import {
  withErrorHandling,
  successResponse,
  authError,
  errorResponse,
  validationError,
} from '@/lib/api';
import type { PaginationMetadata } from '@/lib/api/types';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


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

  // Include representative and bill metadata if available
  if (poll.representative_id != null) {
    basePoll.representativeId = poll.representative_id;
  }
  if (poll.bill_id) {
    basePoll.billId = poll.bill_id;
  }
  if (poll.bill_title) {
    basePoll.billTitle = poll.bill_title;
  }
  if (poll.bill_summary) {
    basePoll.billSummary = poll.bill_summary;
  }
  if (poll.poll_type) {
    basePoll.pollType = poll.poll_type;
  }

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

type NumberParamParseOptions = {
  paramName: string;
  defaultValue: number;
  min: number;
  max?: number;
};

const parseNumberParam = (
  rawValue: string | null,
  { paramName, defaultValue, min, max }: NumberParamParseOptions,
): { value: number } | { error: string } => {
  if (rawValue === null) {
    return { value: defaultValue };
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { error: `${paramName} must be an integer.` };
  }

  if (parsed < min) {
    return { error: `${paramName} must be at least ${min}.` };
  }

  if (typeof max === 'number' && parsed > max) {
    return { error: `${paramName} must be at most ${max}.` };
  }

  return { value: parsed };
};

const ALLOWED_STATUSES = new Set(['active', 'closed', 'draft', 'trending', 'all']);
const ALLOWED_SORTS = new Set(['popular', 'trending', 'engagement', 'newest']);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseCursor(cursor: string): { created_at: string; id: string } | null {
  const parts = cursor.split(',');
  if (parts.length !== 2) return null;
  const [created_at, id] = parts.map((s) => s.trim());
  if (!created_at || !id) return null;
  const t = new Date(created_at);
  if (Number.isNaN(t.getTime())) return null;
  if (!UUID_RE.test(id)) return null;
  return { created_at, id };
}

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
 * @param {string} [request.searchParams.cursor] - Opaque cursor for keyset pagination (format: created_at,id). Use when sort=newest for deep pagination.
 * @returns {Promise<NextResponse>} Poll data response
 *
 * @example
 * GET /api/polls?status=trending&category=politics&sort=popular
 * GET /api/polls?sort=newest&limit=20&cursor=2025-01-01T00:00:00.000Z,abc-uuid
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase not configured');
    return errorResponse('Database not available', 500);
  }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const hashtags = searchParams.get('hashtags');
    const search = searchParams.get('search') ?? undefined;
    const sortRaw = searchParams.get('sort') ?? 'newest';
    const includeHashtagData = searchParams.get('include_hashtag_data') === 'true';
    const includeAnalytics = searchParams.get('include_analytics') === 'true';
    const representativeIdRaw = searchParams.get('representative_id');
    const pollType = searchParams.get('poll_type') ?? undefined;

    const limitResult = parseNumberParam(searchParams.get('limit'), {
      paramName: 'limit',
      defaultValue: 20,
      min: 1,
      max: 100,
    });
    if ('error' in limitResult) {
      return validationError({ limit: limitResult.error });
    }

    const offsetResult = parseNumberParam(searchParams.get('offset'), {
      paramName: 'offset',
      defaultValue: 0,
      min: 0,
      max: 10_000,
    });
    if ('error' in offsetResult) {
      return validationError({ offset: offsetResult.error });
    }

    const limit = limitResult.value;
    const offset = offsetResult.value;
    const cursorRaw = searchParams.get('cursor') ?? undefined;

    if (status && !ALLOWED_STATUSES.has(status)) {
      return validationError({
        status: `Unsupported status "${status}". Allowed values: ${Array.from(ALLOWED_STATUSES).join(', ')}`,
      });
    }

    const sort = ALLOWED_SORTS.has(sortRaw) ? sortRaw : 'newest';
    const useCursor = !!cursorRaw && sort === 'newest';
    const parsedCursor = useCursor && cursorRaw ? parseCursor(cursorRaw) : null;
    if (useCursor && !parsedCursor) {
      return validationError({ cursor: 'Invalid cursor format. Use created_at,id (ISO date, UUID).' });
    }

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
      representative_id,
      bill_id,
      bill_title,
      bill_summary,
      poll_type
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
      .select(selectFields, { count: useCursor ? 'exact' : 'exact' });

    if (useCursor && parsedCursor) {
      query = query
        .or(`created_at.lt.${parsedCursor.created_at},and(created_at.eq.${parsedCursor.created_at},id.lt.${parsedCursor.id})`)
        .limit(limit);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

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
    if (representativeIdRaw) {
      const representativeId = parseInt(representativeIdRaw, 10);
      if (!isNaN(representativeId)) {
        query = query.eq('representative_id', representativeId);
      } else {
        return validationError({ representative_id: 'representative_id must be a valid integer' });
      }
    }
    if (pollType) {
      query = query.eq('poll_type', pollType);
    }

    // Apply sorting (id secondary for deterministic cursor pagination)
    switch (sort) {
      case 'popular':
        query = query.order('total_votes', { ascending: false }).order('id', { ascending: false });
        break;
      case 'trending':
        query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
        break;
      case 'engagement':
        query = query.order('total_votes', { ascending: false }).order('id', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
        break;
    }

    const { data: polls, error, count } = await query;

    if (error) {
      logger.error('Error fetching polls:', { message: error.message, code: error.code, details: error.details });
      return errorResponse(`Failed to fetch polls: ${error.message}`, 500);
    }

    const userIds = polls && polls.length > 0
      ? [...new Set((polls as any[]).map((poll: any) => poll.created_by).filter(Boolean))]
      : [];
    const needTrending = sort === 'trending' || status === 'trending' || includeAnalytics;

    const profilesPromise = userIds.length > 0
      ? supabase
          .from('user_profiles')
          .select('user_id, username, display_name, is_admin')
          .in('user_id', userIds)
      : Promise.resolve({ data: null, error: null });
    const trendingPromise = needTrending
      ? supabase
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
          .limit(10)
      : Promise.resolve({ data: null, error: null });

    const [profilesResult, trendingResult] = await Promise.all([profilesPromise, trendingPromise]);

    let userProfiles: Record<string, any> = {};
    if (userIds.length > 0 && profilesResult && !profilesResult.error && profilesResult.data) {
      const profiles = profilesResult.data as any[];
      userProfiles = profiles.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);
    }

    let trendingHashtags: Array<{ hashtag: Hashtag }> = [];
    if (needTrending && trendingResult && !trendingResult.error && Array.isArray(trendingResult.data)) {
      try {
        const hashtagData = trendingResult.data;
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
      } catch (err) {
        logger.warn('Failed to get trending hashtags:', { error: err instanceof Error ? err.message : 'Unknown error' });
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

    const effectiveTotal =
      status === 'trending'
        ? filteredPolls.length
        : typeof count === 'number'
          ? count
          : offset + filteredPolls.length;

    const cursorHasMore = useCursor && filteredPolls.length === limit;
    const last = cursorHasMore && filteredPolls.length > 0 ? filteredPolls[filteredPolls.length - 1] as Record<string, unknown> : null;
    const nextCursor =
      cursorHasMore && last?.id != null && last?.createdAt != null
        ? `${typeof last.createdAt === 'string' ? last.createdAt : (last.createdAt as Date)?.toISOString?.() ?? ''},${last.id}`
        : undefined;

    const hasMore = useCursor ? cursorHasMore : offset + filteredPolls.length < effectiveTotal;
    const pagination: PaginationMetadata = {
      limit,
      offset: useCursor ? 0 : offset,
      total: effectiveTotal,
      hasMore,
      page: useCursor ? 1 : Math.floor(offset / limit) + 1,
      totalPages: Math.max(1, Math.ceil(effectiveTotal / limit)),
      ...(nextCursor ? { nextCursor } : {}),
    };

    logger.info('Polls fetched successfully', {
      count: filteredPolls.length,
      filters: { status, category, hashtags, search, sort },
      includeHashtagData,
      includeAnalytics,
    });

    return successResponse(
      {
        polls: filteredPolls,
        ...(includeAnalytics
          ? {
              analytics: {
                trendingHashtags: trendingHashtags.slice(0, 10),
                totalHashtags: trendingHashtags.length,
              },
            }
          : {}),
      },
      {
        pagination,
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    logger.warn('User not authenticated');
    return authError('Authentication required');
  }

    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return validationError({ body: 'Invalid JSON payload.' });
    }

    // Validation schema for poll creation
    const pollCreationSchema = z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
      description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
      question: z.string().min(1, 'Question is required').max(500, 'Question must be at most 500 characters'),
      options: z.array(z.union([
        z.string().min(1, 'Option text cannot be empty'),
        z.object({
          text: z.string().min(1, 'Option text cannot be empty'),
        }).passthrough(),
      ])).min(2, 'Provide at least two poll options').max(20, 'Maximum 20 options allowed'),
      category: z.string().max(100, 'Category must be at most 100 characters').optional(),
      tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
      settings: z.record(z.string(), z.unknown()).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      representative_id: z.number().int().positive().optional(),
      bill_id: z.string().optional(),
      bill_title: z.string().optional(),
      bill_summary: z.string().optional(),
      poll_type: z.enum(['standard', 'constituent_will']).optional(),
    });

    // Validate with Zod schema
    const validationResult = pollCreationSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path.join('.') || 'body';
        fieldErrors[field] = issue.message;
      });
      return validationError(fieldErrors, 'Invalid poll data');
    }

    const {
      title,
      description,
      question,
      options,
      category,
      tags,
      settings,
      metadata,
      representative_id,
      bill_id,
      bill_title,
      bill_summary,
      poll_type,
    } = validationResult.data;

    const resolveVotingMethod = () => {
      const method = (metadata?.votingMethod ?? settings?.votingMethod ?? 'single').toString().toLowerCase();
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

    // Create sophisticated poll with enhanced features
    // Type-safe check for autoLockDuration
    const autoLockDuration = typeof settings?.autoLockDuration === 'number' ? settings.autoLockDuration : null;
    const autoLockAt = autoLockDuration
      ? new Date(Date.now() + autoLockDuration * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Extract end date from metadata (set by poll wizard)
    const endDate = typeof metadata?.endDate === 'string' ? metadata.endDate : null;
    const endTime = endDate ? new Date(endDate).toISOString() : null;

    const pollData = {
      title: title.trim(),
      description: description?.trim() ?? '',
      question: question.trim(),
      category: category ?? 'general',
      tags: tags ?? [],
      created_by: user.id,
      status: 'active',
      voting_method: normalizedVotingMethod,
      end_time: endTime, // Set closing time if provided

        // Sophisticated poll features
        auto_lock_at: autoLockAt,
        lock_duration: autoLockDuration ?? null,
        lock_type: autoLockDuration ? 'automatic' : null,
        moderation_status: typeof settings?.requireModeration === 'boolean' && settings.requireModeration ? 'pending' : 'approved',
        privacy_level: typeof settings?.privacyLevel === 'string' ? settings.privacyLevel : 'public',
        is_verified: false,
        is_featured: false,
        is_trending: false,
        trending_score: 0,
        engagement_score: 0,
        participation_rate: 0,
        total_views: 0,
        participation: 0,
        total_votes: 0, // CRITICAL: Initialize vote count to 0

        // Advanced settings (type-safe extraction)
        poll_settings: {
          // allow_anonymous removed from UI - set to false for new polls (backward compatible)
          allow_anonymous: false,
          require_verification: typeof settings?.requireVerification === 'boolean' ? settings.requireVerification : false,
          auto_lock_duration: autoLockDuration ?? null,
          moderation_required: typeof settings?.requireModeration === 'boolean' ? settings.requireModeration : false,
          allow_multiple_votes: typeof settings?.allowMultipleVotes === 'boolean' ? settings.allowMultipleVotes : false,
          max_selections: (typeof metadata?.maxSelections === 'number' ? metadata.maxSelections : typeof settings?.maxSelections === 'number' ? settings.maxSelections : null),
          voting_method: normalizedVotingMethod,
          show_results_before_close: typeof settings?.showResultsBeforeClose === 'boolean' ? settings.showResultsBeforeClose : false,
          // allow_comments removed from UI - set to false for new polls
          // Kept in DB schema for backward compatibility with existing polls
          allow_comments: false,
          allow_sharing: typeof settings?.allowSharing === 'boolean' ? settings.allowSharing !== false : true,
          // require_authentication removed from UI - set to false for new polls (backward compatible)
          // Main vote endpoint always requires auth. Shared polls allow anonymous voting.
          require_authentication: false
        },
        settings: {
          allow_multiple_votes: typeof settings?.allowMultipleVotes === 'boolean' ? settings.allowMultipleVotes : false,
          // allow_anonymous_votes removed from UI - set to false for new polls (backward compatible)
          allow_anonymous_votes: false,
          show_results_before_close: typeof settings?.showResultsBeforeClose === 'boolean' ? settings.showResultsBeforeClose : false,
          allow_comments: typeof settings?.allowComments === 'boolean' ? settings.allowComments : true,
          allow_sharing: typeof settings?.allowSharing === 'boolean' ? settings.allowSharing !== false : true,
          // require_authentication removed from UI - set to false for new polls (backward compatible)
          // Main vote endpoint always requires auth. Shared polls allow anonymous voting.
          require_authentication: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Representative and bill metadata
        ...(representative_id ? { representative_id } : {}),
        ...(bill_id ? { bill_id } : {}),
        ...(bill_title ? { bill_title } : {}),
        ...(bill_summary ? { bill_summary } : {}),
        poll_type: poll_type ?? 'standard',
    };

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert(pollData as any)
      .select('id, title, description, category, status, poll_settings, auto_lock_at, moderation_status, privacy_level, is_verified, is_featured, engagement_score, created_at')
      .single();

    if (pollError) {
      logger.error('Error creating poll:', pollError);
      return errorResponse('Failed to create poll', 500, pollError.message);
    }

    // Normalize options (Zod already validated structure, but we normalize for database)
    const normalizedOptions = options.map((option, index: number) => {
      const value =
        typeof option === 'string'
          ? option.trim()
          : typeof option === 'object' && option !== null && 'text' in option && typeof option.text === 'string'
            ? option.text.trim()
            : '';
      return { value, order: index };
    });

    const invalidOption = normalizedOptions.find((option) => option.value.length === 0);
    if (invalidOption) {
      return validationError({
        options: 'Each option must include display text.',
      });
    }

    // Create poll options
    const optionsData = normalizedOptions.map(({ value, order }) => ({
      poll_id: poll.id,
      text: value,
      option_text: value,
      order_index: order,
      vote_count: 0,
    }));

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
      .select('id')
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
