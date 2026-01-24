import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import {
  errorResponse,
  successResponse,
  validationError,
  withErrorHandling,
} from '@/lib/api';
import { SITE_MESSAGE_SELECT_COLUMNS } from '@/lib/api/response-builders';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/site-messages - Get site messages for admin management
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'all';
  const priority = searchParams.get('priority') ?? 'all';
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '50', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('Authentication required', 401);
  }

  const adminSupabase = await getSupabaseAdminClient();

  // Build query for site messages
  let query = adminSupabase
    .from('site_messages')
    .select(SITE_MESSAGE_SELECT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Apply filters
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (priority !== 'all') {
    query = query.eq('priority', priority);
  }

  const { data: messages, error } = await query;

  if (error) {
    logger.error('Error fetching site messages:', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to fetch site messages', 500);
  }

  return successResponse({
    messages: messages ?? [],
    filters: {
      status,
      priority,
      limit,
    },
    total: messages?.length ?? 0,
    adminUser: {
      id: user.id,
      email: user.email,
    },
  });
});

/**
 * POST /api/admin/site-messages - Create a new site message
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('Authentication required', 401);
  }

  const parsedBody = await request.json().catch(() => null);
  const {
    title,
    message,
    priority,
    status,
    target_audience,
    start_date,
    end_date,
    type,
    is_active,
  } = parsedBody ?? {};

  if (!title || !message) {
    const errors: Record<string, string> = {};
    if (!title) {
      errors.title = 'Title is required';
    }
    if (!message) {
      errors.message = 'Message is required';
    }
    return validationError(errors);
  }

  const adminSupabase = await getSupabaseAdminClient();
  const resolvedIsActive =
    typeof is_active === 'boolean' ? is_active : status ? status === 'active' : true;
  const resolvedStatus = status ?? (resolvedIsActive ? 'active' : 'inactive');

  const { data: siteMessage, error } = await adminSupabase
    .from('site_messages')
    .insert({
      title,
      message,
      priority: priority ?? 'medium',
      status: resolvedStatus,
      target_audience: target_audience ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      type: type ?? 'info',
      is_active: resolvedIsActive,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating site message:', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to create site message', 500);
  }

  return successResponse(
    {
      message: 'Site message created successfully',
      siteMessage,
    },
    undefined,
    201
  );
});
