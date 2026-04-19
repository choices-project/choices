import { z } from 'zod';

import {
  validateCsrfProtection,
  createCsrfErrorResponse,
} from '@/app/api/auth/_shared';
import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse, validationError, authError } from '@/lib/api';
import { HASHTAG_FLAG_SELECT_COLUMNS, HASHTAGS_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { sanitizeInput } from '@/lib/core/auth/server-actions';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

type HashtagFlagRow = {
  id: string;
  hashtag_id: string;
  flag_type: string;
  reason: string | null;
  status: string | null;
  user_id: string;
  created_at: string | null;
};

type HashtagRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  follower_count: number | null;
  usage_count: number | null;
  is_featured: boolean | null;
  is_trending: boolean | null;
  is_verified: boolean | null;
  trending_score: number | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  metadata: unknown;
};

function buildModerationPayload(hashtagId: string, flags: HashtagFlagRow[]) {
  const pendingFlags = flags.filter((f) => f.status === 'pending');
  const moderationStatus =
    pendingFlags.length > 0 ? 'pending' : flags.length > 0 ? 'flagged' : 'approved';

  const transformedFlags = flags.map((flag) => ({
    id: flag.id,
    hashtag_id: flag.hashtag_id,
    user_id: flag.user_id,
    flag_type: flag.flag_type,
    reason: flag.reason ?? '',
    created_at: flag.created_at ?? new Date().toISOString(),
    updated_at: flag.created_at ?? new Date().toISOString(),
    status:
      flag.status === 'approved'
        ? 'resolved'
        : flag.status === 'rejected'
          ? 'rejected'
          : 'pending',
  }));

  return {
    id: `moderation_${hashtagId}`,
    hashtag_id: hashtagId,
    status: moderationStatus,
    created_at: flags[0]?.created_at ?? new Date().toISOString(),
    updated_at: flags[0]?.created_at ?? new Date().toISOString(),
    human_review_required: pendingFlags.length > 0,
    ...(pendingFlags.length > 0 ? { moderation_reason: 'Pending review' as const } : {}),
    flags: transformedFlags,
  };
}

function hashtagRowToApiShape(row: HashtagRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: (row.category ?? 'custom') as string,
    usage_count: row.usage_count ?? 0,
    is_trending: row.is_trending ?? false,
    is_verified: row.is_verified ?? false,
    is_featured: row.is_featured ?? undefined,
    follower_count: row.follower_count ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    created_by: row.created_by ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | undefined) ?? undefined,
  };
}

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

  // Single-hashtag moderation summary (requires authentication)
  if (action === 'moderation') {
    const hashtagIdRaw = url.searchParams.get('hashtagId');
    if (!hashtagIdRaw?.trim()) {
      return validationError({ hashtagId: 'hashtagId is required' });
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return authError('Authentication required');
    }

    const hashtagId = sanitizeInput(hashtagIdRaw.trim());

    const { data: flags, error } = await supabase
      .from('hashtag_flags')
      .select(HASHTAG_FLAG_SELECT_COLUMNS)
      .eq('hashtag_id', hashtagId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(
        'Failed to fetch hashtag moderation',
        error instanceof Error ? error : new Error(String(error)),
      );
      return errorResponse('Failed to fetch hashtag moderation', 500);
    }

    return successResponse(buildModerationPayload(hashtagId, (flags ?? []) as HashtagFlagRow[]), {
      timestamp: new Date().toISOString(),
    });
  }

  // Get moderation queue (requires authentication)
  if (action === 'moderation-queue') {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return authError('Authentication required');
    }

    const limitRaw = url.searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '50', 10) || 50, 1), 100);

    const { data: flags, error } = await supabase
      .from('hashtag_flags')
      .select(HASHTAG_FLAG_SELECT_COLUMNS)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(
        'Failed to fetch moderation queue',
        error instanceof Error ? error : new Error(String(error)),
      );
      return errorResponse('Failed to fetch moderation queue', 500);
    }

    const flagRows = (flags ?? []) as HashtagFlagRow[];
    const uniqueIds = [...new Set(flagRows.map((f) => f.hashtag_id))];

    const maxFlagTime = (id: string) => {
      const times = flagRows
        .filter((f) => f.hashtag_id === id)
        .map((f) => new Date(f.created_at ?? 0).getTime());
      return times.length ? Math.max(...times) : 0;
    };

    uniqueIds.sort((a, b) => maxFlagTime(b) - maxFlagTime(a));

    const idsForPage = uniqueIds.slice(0, limit);

    if (idsForPage.length === 0) {
      return successResponse([], { timestamp: new Date().toISOString() });
    }

    const { data: hashtagRows, error: hashtagError } = await supabase
      .from('hashtags')
      .select(HASHTAGS_SELECT_COLUMNS)
      .in('id', idsForPage);

    if (hashtagError) {
      logger.error(
        'Failed to fetch hashtags for moderation queue',
        hashtagError instanceof Error ? hashtagError : new Error(String(hashtagError)),
      );
      return errorResponse('Failed to fetch moderation queue', 500);
    }

    const byId = new Map((hashtagRows as HashtagRow[] | null)?.map((r) => [r.id, r]) ?? []);

    const items = idsForPage.map((hid) => {
      const row = byId.get(hid);
      const hf = flagRows.filter((f) => f.hashtag_id === hid);
      const hashtag = row
        ? hashtagRowToApiShape(row)
        : {
            id: hid,
            name: hid,
            category: 'custom',
            usage_count: 0,
            is_trending: false,
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
      return {
        ...hashtag,
        moderation: buildModerationPayload(hid, hf),
      };
    });

    return successResponse(items, { timestamp: new Date().toISOString() });
  }

  return validationError({ action: 'Invalid action' });
});

/**
 * Handle hashtag actions (flag, approve, reject, moderate)
 *
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.action] - Action type (flag, approve, reject, moderate)
 * @param {string} [request.searchParams.flagId] - Flag ID for approve/reject actions
 * @returns {Promise<NextResponse>} Action result
 *
 * @example
 * POST /api/hashtags?action=flag
 * POST /api/hashtags?action=approve&flagId=123
 * POST /api/hashtags?action=moderate
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const flagId = url.searchParams.get('flagId');

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return authError('Authentication required');
  }

    // Flag a hashtag
    if (action === 'flag') {
      const flagSchema = z.object({
        hashtag: z.string().min(1, 'Hashtag ID is required').max(100).optional(),
        hashtagId: z.string().min(1, 'Hashtag ID is required').max(100).optional(),
        reason: z.string().min(1, 'Reason is required').max(500),
      }).refine((d) => d.hashtag ?? d.hashtagId, { message: 'Hashtag or hashtagId is required' });
      let body: z.infer<typeof flagSchema>;
      try {
        const raw = await request.json();
        const parsed = flagSchema.safeParse(raw);
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          parsed.error.issues.forEach((issue) => {
            const field = issue.path.join('.') || 'body';
            fieldErrors[field] = issue.message;
          });
          return validationError(fieldErrors, 'Invalid flag data');
        }
        body = parsed.data;
      } catch {
        return validationError({ body: 'Request body must be valid JSON' });
      }

      const hashtagValue = (body.hashtag ?? body.hashtagId ?? '').trim();
      const { data, error } = await supabase
        .from('hashtag_flags')
        .insert([{
          hashtag_id: sanitizeInput(hashtagValue),
          flag_type: 'inappropriate',
          reason: sanitizeInput(body.reason.trim()),
          user_id: session.user.id,
          status: 'pending'
        }])
        .select(HASHTAG_FLAG_SELECT_COLUMNS);

      if (error) {
        logger.error('Failed to create hashtag flag', error instanceof Error ? error : new Error(String(error)));
        return errorResponse('Failed to create hashtag flag', 500, undefined, 'HASHTAG_FLAG_CREATE_FAILED');
      }

      return successResponse({
        flag: data[0],
        message: 'Hashtag flagged successfully'
      }, undefined, 201);
    }

    // Approve a flag
    if (action === 'approve' && flagId) {
      const { data, error } = await supabase
        .from('hashtag_flags')
        .update({ status: 'approved' })
        .eq('id', flagId)
        .select(HASHTAG_FLAG_SELECT_COLUMNS);

      if (error) {
        logger.error('Failed to approve hashtag flag', error instanceof Error ? error : new Error(String(error)));
        return errorResponse('Failed to approve hashtag flag', 500, undefined, 'HASHTAG_FLAG_APPROVE_FAILED');
      }

      return successResponse({
        flag: data[0],
        message: 'Hashtag flag approved'
      });
    }

    // Reject a flag
    if (action === 'reject' && flagId) {
      const { data, error } = await supabase
        .from('hashtag_flags')
        .update({ status: 'rejected' })
        .eq('id', flagId)
        .select(HASHTAG_FLAG_SELECT_COLUMNS);

      if (error) {
        logger.error('Failed to reject hashtag flag', error instanceof Error ? error : new Error(String(error)));
        return errorResponse('Failed to reject hashtag flag', 500, undefined, 'HASHTAG_FLAG_REJECT_FAILED');
      }

      return successResponse({
        flag: data[0],
        message: 'Hashtag flag rejected'
      });
    }

  // Bulk-moderate pending flags for a hashtag (approve / reject / flagged)
  if (action === 'moderate') {
    const moderateSchema = z.object({
      hashtagId: z.string().min(1, 'Hashtag ID is required').max(100),
      status: z.enum(['approved', 'rejected', 'flagged']),
      reason: z.string().max(500).optional(),
    });

    let body: z.infer<typeof moderateSchema>;
    try {
      const raw = await request.json();
      const parsed = moderateSchema.safeParse(raw);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          const field = issue.path.join('.') || 'body';
          fieldErrors[field] = issue.message;
        });
        return validationError(fieldErrors, 'Invalid moderation data');
      }
      body = parsed.data;
    } catch {
      return validationError({ body: 'Request body must be valid JSON' });
    }

    const hashtagId = sanitizeInput(body.hashtagId.trim());
    void body.reason;
    const now = new Date().toISOString();

    const updatePayload = {
      status: body.status,
      reviewed_at: now,
      reviewed_by: session.user.id,
    };

    const { error: updateError } = await supabase
      .from('hashtag_flags')
      .update(updatePayload)
      .eq('hashtag_id', hashtagId)
      .eq('status', 'pending');

    if (updateError) {
      logger.error(
        'Failed to moderate hashtag flags',
        updateError instanceof Error ? updateError : new Error(String(updateError)),
      );
      return errorResponse('Failed to moderate hashtag', 500, undefined, 'HASHTAG_MODERATE_FAILED');
    }

    if (body.status === 'rejected') {
      const { error: hashtagUpdateError } = await supabase
        .from('hashtags')
        .update({ is_trending: false })
        .eq('id', hashtagId);

      if (hashtagUpdateError) {
        logger.warn(
          'Hashtag flags moderated but hashtags row update failed',
          hashtagUpdateError instanceof Error ? hashtagUpdateError : new Error(String(hashtagUpdateError)),
        );
      }
    }

    const { data: refreshed, error: refreshError } = await supabase
      .from('hashtag_flags')
      .select(HASHTAG_FLAG_SELECT_COLUMNS)
      .eq('hashtag_id', hashtagId)
      .order('created_at', { ascending: false });

    if (refreshError) {
      logger.error(
        'Failed to reload hashtag flags after moderation',
        refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
      );
      return errorResponse('Failed to load updated moderation state', 500);
    }

    return successResponse(buildModerationPayload(hashtagId, (refreshed ?? []) as HashtagFlagRow[]));
  }

  return validationError({ action: 'Invalid action' });
});
