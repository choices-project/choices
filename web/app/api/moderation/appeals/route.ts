import { z } from 'zod';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  authError,
  errorResponse,
  parseBody,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const AppealSchema = z.object({
  action_id: z.string().min(1),
  message: z.string().min(10),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  const parsedBody = await parseBody(request, AppealSchema);
  if (!parsedBody.success) return parsedBody.error;

  const { data, error } = await (supabase as any)
    .from('moderation_appeals')
    .insert({
      action_id: parsedBody.data.action_id,
      user_id: user.id,
      message: parsedBody.data.message,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create appeal', error);
    return errorResponse('Failed to submit appeal', 500);
  }

  return successResponse({ appeal: data });
});

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  const { data, error } = await (supabase as any)
    .from('moderation_appeals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to load appeals', error);
    return errorResponse('Failed to load appeals', 500);
  }

  return successResponse({ appeals: data ?? [] });
});
