import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { MODERATION_REPORT_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const supabase = await getSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const targetType = searchParams.get('target_type');

  let query = (supabase as any)
    .from('moderation_reports')
    .select(MODERATION_REPORT_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (targetType) {
    query = query.eq('target_type', targetType);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to load moderation reports', error);
    return errorResponse('Failed to load moderation reports', 500);
  }

  return successResponse({ reports: data ?? [] });
});
