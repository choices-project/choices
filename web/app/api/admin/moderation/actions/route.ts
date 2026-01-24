import { z } from 'zod';

import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse, parseBody } from '@/lib/api';
import { MODERATION_ACTION_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const ActionSchema = z.object({
  target_type: z.string().min(1),
  target_id: z.string().min(1),
  action: z.enum(['warn', 'throttle', 'shadow_limit', 'suspend', 'require_verification']),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expires_at: z.string().optional(),
});

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const supabase = await getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from('moderation_actions')
    .select(MODERATION_ACTION_SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to load moderation actions', error);
    return errorResponse('Failed to load moderation actions', 500);
  }

  return successResponse({ actions: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const adminUser = await getAdminUser();
  if (!adminUser) {
    return errorResponse('Admin access required', 403);
  }

  const parsedBody = await parseBody(request, ActionSchema);
  if (!parsedBody.success) return parsedBody.error;

  const supabase = await getSupabaseAdminClient();
  const payload = parsedBody.data;

  const { data, error } = await (supabase as any)
    .from('moderation_actions')
    .insert({
      actor_id: adminUser.id,
      target_type: payload.target_type,
      target_id: payload.target_id,
      action: payload.action,
      reason: payload.reason ?? null,
      metadata: payload.metadata ?? {},
      status: 'active',
      expires_at: payload.expires_at ?? null,
    })
    .select(MODERATION_ACTION_SELECT_COLUMNS)
    .single();

  if (error) {
    logger.error('Failed to create moderation action', error);
    return errorResponse('Failed to create moderation action', 500);
  }

  await (supabase as any)
    .from('admin_activity_log')
    .insert({
      admin_id: adminUser.id,
      action: 'moderation_action_created',
      details: {
        action_id: data?.id ?? null,
        target_type: payload.target_type,
        target_id: payload.target_id,
        action: payload.action,
      },
      created_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    })
    .catch(() => undefined);

  return successResponse({ action: data });
});
