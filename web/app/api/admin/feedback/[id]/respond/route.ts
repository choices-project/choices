import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import {
  withErrorHandling,
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
} from '@/lib/api';
import { NOTIFICATION_LOG_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const adminUser = await getAdminUser();
  if (!adminUser) {
    return errorResponse('Admin access required', 403);
  }

  const { id } = await params;
  const feedbackId = String(id ?? '').trim();
  if (!feedbackId) {
    return validationError({ feedbackId: 'Feedback ID is required' });
  }

  const body = await request.json().catch(() => ({}));
  const responseText =
    typeof body?.response === 'string' ? body.response.trim() : '';
  if (!responseText) {
    return validationError({ response: 'Response is required' });
  }

  const supabase = await getSupabaseServerClient();
  const adminClient = await getSupabaseAdminClient();

  const { data: feedbackRow, error: feedbackError } = await supabase
    .from('feedback')
    .select('id, user_id, title, description')
    .eq('id', feedbackId)
    .single();

  if (feedbackError) {
    devLog('Failed to load feedback for response', { feedbackId, error: feedbackError });
    return errorResponse('Failed to load feedback', 500);
  }

  if (!feedbackRow) {
    return notFoundError('Feedback not found');
  }

  if (!feedbackRow.user_id) {
    return validationError({ userId: 'Feedback was submitted anonymously' });
  }

  const respondedAt = new Date().toISOString();

  const { error: updateError } = await adminClient
    .from('feedback')
    .update({
      admin_response: responseText,
      admin_response_at: respondedAt,
      admin_response_by: adminUser.id,
      updated_at: respondedAt,
    })
    .eq('id', feedbackId);

  if (updateError) {
    devLog('Failed to store feedback response', { feedbackId, error: updateError });
    return errorResponse('Failed to store feedback response', 500);
  }

  const { data: notification, error: notificationError } = await adminClient
    .from('notification_log')
    .insert({
      user_id: feedbackRow.user_id,
      title: 'Response to your feedback',
      body: responseText,
      payload: {
        feedbackId,
        feedbackTitle: feedbackRow.title ?? undefined,
        feedbackSummary: feedbackRow.description?.slice(0, 280) ?? undefined,
        respondedBy: adminUser.id,
      },
      status: 'sent',
    })
    .select(NOTIFICATION_LOG_SELECT_COLUMNS)
    .single();

  if (notificationError) {
    devLog('Failed to send feedback response notification', {
      feedbackId,
      error: notificationError,
    });
    return errorResponse('Response saved, but notification failed', 502);
  }

  return successResponse({
    feedbackId,
    response: responseText,
    respondedAt,
    notificationId: notification?.id ?? null,
  });
});
