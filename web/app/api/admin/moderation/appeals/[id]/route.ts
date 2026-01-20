import { z } from 'zod';

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse, parseBody } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const AppealUpdateSchema = z.object({
  status: z.enum(['open', 'reviewing', 'resolved', 'rejected']),
  resolution: z.string().optional(),
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

  const parsedBody = await parseBody(request, AppealUpdateSchema);
  if (!parsedBody.success) return parsedBody.error;

  const appealId = params.id;
  const supabase = await getSupabaseAdminClient();

  const { data, error } = await (supabase as any)
    .from('moderation_appeals')
    .update({
      status: parsedBody.data.status,
      resolution: parsedBody.data.resolution ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appealId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update appeal', error);
    return errorResponse('Failed to update appeal', 500);
  }

  await (supabase as any)
    .from('admin_activity_log')
    .insert({
      admin_id: adminUser.id,
      action: 'moderation_appeal_updated',
      details: {
        appeal_id: appealId,
        status: parsedBody.data.status,
      },
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    })
    .catch(() => undefined);

  return successResponse({ appeal: data });
});
