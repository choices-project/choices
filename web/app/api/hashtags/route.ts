import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return errorResponse('Supabase not configured', 500);
  }

    // Get moderation queue
    if (action === 'moderation-queue') {
      const { data: flags, error } = await supabase
        .from('hashtag_flags')
        .select('*')
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

    // Flag a hashtag
    if (action === 'flag') {
      const body = await request.json();

      const { data, error } = await supabase
        .from('hashtag_flags')
        .insert([{
          hashtag_id: body.hashtag, // Changed from 'hashtag' to 'hashtag_id'
          flag_type: 'inappropriate', // Added required field
          reason: body.reason,
          user_id: body.reporter_id, // Changed from 'reporter_id' to 'user_id'
          status: 'pending'
        }])
        .select();

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
        .select();

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
        .select();

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
