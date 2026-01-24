import { z } from 'zod';

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse, validationError, parseBody } from '@/lib/api';
import { MODERATION_REPORT_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const StatusSchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'dismissed']),
});

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const adminUser = await getAdminUser();
  if (!adminUser) {
    return errorResponse('Admin access required', 403);
  }

  const parsedBody = await parseBody(request, StatusSchema);
  if (!parsedBody.success) return parsedBody.error;

  const reportId = params.id;
  if (!reportId) {
    return validationError({ reportId: 'Report ID is required' });
  }

  const supabase = await getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from('moderation_reports')
    .update({
      status: parsedBody.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select(MODERATION_REPORT_SELECT_COLUMNS)
    .single();

  if (error) {
    logger.error('Failed to update report status', error);
    return errorResponse('Failed to update report status', 500);
  }

  await (supabase as any)
    .from('admin_activity_log')
    .insert({
      admin_id: adminUser.id,
      action: 'moderation_report_updated',
      details: {
        report_id: reportId,
        status: parsedBody.data.status,
      },
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    })
    .catch(() => undefined);

  return successResponse({ report: data });
});
