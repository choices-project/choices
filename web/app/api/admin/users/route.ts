import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import {
  errorResponse,
  paginatedResponse,
  successResponse,
  validationError,
  withErrorHandling,
} from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  const supabase = await getSupabaseServerClient();
  const adminSupabase = await getSupabaseAdminClient();

  if (!supabase || !adminSupabase) {
    return errorResponse('Database connection not available', 500);
  }

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const parsedPage = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '20', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20
  const search = searchParams.get('search') ?? ''
  const trustTier = searchParams.get('trust_tier') ?? ''

  if (parsedPage <= 0 || parsedLimit <= 0) {
    return validationError({
      page: 'page must be greater than 0',
      limit: 'limit must be greater than 0',
    });
  }

  // Build query
  let query = adminSupabase
    .from('user_profiles')
    .select(
      `
        user_id,
        username,
        email,
        is_admin,
        created_at,
        updated_at,
        last_login_at
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // Apply filters
  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
  }

  // Filter by admin status instead of trust_tier
  if (trustTier === 'admin') {
    query = query.eq('is_admin', true)
  } else if (trustTier === 'user') {
    query = query.eq('is_admin', false)
  }

  // Apply pagination
  const offset = (page - 1) * limit
  const to = offset + limit - 1
  query = query.range(offset, to)

  const { data: users, error, count } = await query

  if (error) {
    logger.error('Error fetching users:', error)
    return errorResponse('Failed to fetch users', 500);
  }

  return paginatedResponse(users ?? [], {
    total: count ?? users?.length ?? 0,
    limit,
    offset,
  });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  const supabase = await getSupabaseServerClient();
  const adminSupabase = await getSupabaseAdminClient();

  if (!supabase || !adminSupabase) {
    return errorResponse('Database connection not available', 500);
  }

  const body = await request.json().catch(() => null)
  const { userId, updates } = body ?? {}

  if (typeof userId !== 'string' || !updates || typeof updates !== 'object') {
    return validationError({
      userId: 'userId (string) is required',
      updates: 'updates (object) is required',
    });
  }

  // Validate updates
  const allowedFields = ['is_admin', 'username']
  const validUpdates: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(updates as Record<string, unknown>)) {
    if (allowedFields.includes(key)) {
      validUpdates[key] = value
    }
  }

  if (Object.keys(validUpdates).length === 0) {
    return validationError({
      updates: 'No valid fields to update. Allowed: is_admin, username',
    });
  }

  // Update user profile
  const { error: updateError } = await adminSupabase
    .from('user_profiles')
    .update({
      ...validUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    logger.error('Error updating user:', updateError)
    return errorResponse('Failed to update user', 500);
  }

  return successResponse({
    message: 'User updated successfully',
    userId,
    updatedFields: Object.keys(validUpdates),
  });
});
