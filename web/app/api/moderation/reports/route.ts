import { z } from 'zod';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  authError,
  errorResponse,
  parseBody,
} from '@/lib/api';
import { MODERATION_REPORT_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const ReportSchema = z.object({
  target_type: z.enum(['poll', 'comment', 'user', 'message']),
  target_id: z.string().min(1),
  reason: z.string().min(3),
  details: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  const parsedBody = await parseBody(request, ReportSchema);
  if (!parsedBody.success) {
    return parsedBody.error;
  }

  const payload = parsedBody.data;

  const { data, error } = await (supabase as any)
    .from('moderation_reports')
    .insert({
      reporter_id: user.id,
      target_type: payload.target_type,
      target_id: payload.target_id,
      reason: payload.reason,
      details: payload.details ?? null,
      metadata: payload.metadata ?? {},
      status: 'open',
    })
    .select(MODERATION_REPORT_SELECT_COLUMNS)
    .single();

  if (error) {
    logger.error('Failed to create moderation report', error);
    return errorResponse('Failed to create report', 500);
  }

  return successResponse({ report: data });
});

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  const { data, error } = await (supabase as any)
    .from('moderation_reports')
    .select(MODERATION_REPORT_SELECT_COLUMNS)
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to load moderation reports', error);
    return errorResponse('Failed to load reports', 500);
  }

  return successResponse({ reports: data ?? [] });
});
