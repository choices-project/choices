import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import {
  errorResponse,
  successResponse,
  validationError,
  withErrorHandling,
  notFoundError,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/site-messages/[id] - Update a site message
 */
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const { id } = await params;
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
  if (!parsedBody) {
    return validationError({ body: 'Request body is required' });
  }

  const { title, message, priority, status, type, is_active, target_audience, start_date, end_date } = parsedBody;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updateData.title = title;
  if (message !== undefined) updateData.message = message;
  if (priority !== undefined) updateData.priority = priority;
  if (status !== undefined) updateData.status = status;
  if (type !== undefined) updateData.type = type;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (target_audience !== undefined) updateData.target_audience = target_audience;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (end_date !== undefined) updateData.end_date = end_date;

  const adminSupabase = await getSupabaseAdminClient();
  if (is_active !== undefined && status === undefined) {
    updateData.status = is_active ? 'active' : 'inactive';
  } else if (status !== undefined && is_active === undefined) {
    updateData.is_active = status === 'active';
  }

  const { data: siteMessage, error } = await adminSupabase
    .from('site_messages')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating site message:', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to update site message', 500);
  }

  if (!siteMessage) {
    return notFoundError('Site message not found');
  }

  return successResponse({
    message: 'Site message updated successfully',
    siteMessage,
  });
});

/**
 * DELETE /api/admin/site-messages/[id] - Delete a site message
 */
export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const { id } = await params;
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
  const { data: siteMessage, error } = await adminSupabase
    .from('site_messages')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error deleting site message:', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to delete site message', 500);
  }

  if (!siteMessage) {
    return notFoundError('Site message not found');
  }

  return successResponse({
    message: 'Site message deleted successfully',
    siteMessage,
  });
});

