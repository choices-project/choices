import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { MODERATION_APPEAL_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const supabase = await getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from('moderation_appeals')
    .select(MODERATION_APPEAL_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to load appeals', error);
    return errorResponse('Failed to load appeals', 500);
  }

  return successResponse({ appeals: data ?? [] });
});
