/**
 * Admin: Representative Audit Log
 *
 * GET /api/admin/audit/representatives
 *
 * Returns audit log entries for representative overrides with:
 * - Diff comparison (old_value vs new_value)
 * - Filtering by representativeId, field, userId, date range
 * - Search functionality
 *
 * Query Parameters:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - representativeId: number (filter by representative)
 * - field: string (filter by field name)
 * - userId: string (filter by user who made change)
 * - fromDate: ISO date string (filter from date)
 * - toDate: ISO date string (filter to date)
 * - search: string (search in field names)
 *
 * Authentication: Requires x-admin-key header matching ADMIN_MONITORING_KEY
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, forbiddenError, methodNotAllowed } from '@/lib/api';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

/**
 * Generate a diff representation of the change
 */
function generateDiff(oldValue: unknown, newValue: unknown): {
  hasChange: boolean;
  diff: string;
  oldDisplay: string;
  newDisplay: string;
} {
  const oldStr = oldValue === null || oldValue === undefined ? '(empty)' : String(oldValue);
  const newStr = newValue === null || newValue === undefined ? '(empty)' : String(newValue);
  const hasChange = oldStr !== newStr;

  // For simple string changes, show a clear diff
  let diff = '';
  if (hasChange) {
    diff = `${oldStr} → ${newStr}`;
  } else {
    diff = '(no change)';
  }

  return {
    hasChange,
    diff,
    oldDisplay: oldStr,
    newDisplay: newStr,
  };
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const adminHeader = request.headers.get('x-admin-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    return forbiddenError('Invalid admin key');
  }

  const supabase = await getSupabaseServerClient();
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100); // Max 100
  const offset = Number(searchParams.get('offset') ?? 0);
  const representativeId = searchParams.get('representativeId');
  const field = searchParams.get('field');
  const userId = searchParams.get('userId');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const search = searchParams.get('search');

  let query = (supabase as any)
    .from('representative_overrides_audit')
    .select('id, representative_id, user_id, field, old_value, new_value, created_at')
    .order('created_at', { ascending: false });

  // Apply filters
  if (representativeId) {
    query = query.eq('representative_id', Number(representativeId));
  }
  if (field) {
    query = query.eq('field', field);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (fromDate) {
    query = query.gte('created_at', fromDate);
  }
  if (toDate) {
    query = query.lte('created_at', toDate);
  }
  if (search) {
    // Search in field names (case-insensitive)
    query = query.ilike('field', `%${search}%`);
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    return successResponse({
      items: [],
      limit,
      offset,
      error: 'Failed to fetch audit log',
    });
  }

  // Enhance items with diff information
  const items = (Array.isArray(data) ? data : []).map((item: any) => {
    const diffInfo = generateDiff(item.old_value, item.new_value);
    return {
      ...item,
      diff: diffInfo.diff,
      hasChange: diffInfo.hasChange,
      oldDisplay: diffInfo.oldDisplay,
      newDisplay: diffInfo.newDisplay,
    };
  });

  return successResponse({
    items,
    limit,
    offset,
    total: items.length, // Note: For accurate total, would need a separate count query
  });
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));

