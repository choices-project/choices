import { z } from 'zod';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse, validationError, authError } from '@/lib/api';
import { HASHTAG_FLAG_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { sanitizeInput } from '@/lib/core/auth/server-actions';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

    // Get moderation queue (requires authentication)
    if (action === 'moderation-queue') {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return authError('Authentication required');
      }

      const { data: flags, error } = await supabase
        .from('hashtag_flags')
        .select(HASHTAG_FLAG_SELECT_COLUMNS)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch moderation queue', error instanceof Error ? error : new Error(String(error)));
      return errorResponse('Failed to fetch moderation queue', 500);
    }

    return successResponse(
      {
        flags,
        count: flags?.length ?? 0
      },
      {
        timestamp: new Date().toISOString()
      }
    );
    }

  return validationError({ action: 'Invalid action' });
});

/**
 * Handle hashtag actions (flag, approve, reject)
 *
 * @param {NextRequest} request - Request object
 * @param {string} [request.searchParams.action] - Action type (flag, approve, reject)
 * @param {string} [request.searchParams.flagId] - Flag ID for approve/reject actions
 * @returns {Promise<NextResponse>} Action result
 *
 * @example
 * POST /api/hashtags?action=flag
 * POST /api/hashtags?action=approve&flagId=123
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
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

  return validationError({ action: 'Invalid action' });
});
