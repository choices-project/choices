/**
 * User Activity Log API
 * 
 * Allows users to view their own activity history from audit logs.
 * Transparency feature - shows users what actions have been logged.
 * 
 * Features:
 * - View own audit log entries
 * - Filter by date range
 * - Pagination support
 * - User-only access (RLS enforced)
 * 
 * Created: November 7, 2025
 * Status: Production-ready
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withErrorHandling, authError, errorResponse } from '@/lib/api';
import { createAuditLogService } from '@/lib/services/audit-log-service';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/activity-log
 * 
 * Query Parameters:
 * - limit: Number of results (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 * - startDate: Start date (ISO string)
 * - endDate: End date (ISO string)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  // Authentication required
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(
    parseInt(searchParams.get('limit') || '50'),
    200 // Maximum 200 results for user endpoint
  );
  const offset = parseInt(searchParams.get('offset') || '0');

  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : undefined;
  
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : undefined;

  // Create audit log service
  const auditLog = createAuditLogService(supabase);

  // Search user's own logs (RLS will enforce user_id = auth.uid())
  const filters: Parameters<typeof auditLog.search>[0] = {
    userId: user.id, // Only this user's logs
    limit: limit + offset, // Get more for pagination
  };

  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  // Fetch logs
  const allLogs = await auditLog.search(filters);
  
  // Apply offset
  const paginatedLogs = allLogs.slice(offset, offset + limit);

  // Return user-friendly format
  return NextResponse.json({
    success: true,
    activity: paginatedLogs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      event: log.event_name,
      type: log.event_type,
      resource: log.resource,
      action: log.action,
      details: log.metadata,
      ip_address: log.ip_address
    })),
    pagination: {
      limit,
      offset,
      total: allLogs.length,
      hasMore: allLogs.length > offset + limit
    }
  });
});

/**
 * Example usage:
 * 
 * Get recent activity:
 * GET /api/user/activity-log?limit=50
 * 
 * Get activity for last 30 days:
 * GET /api/user/activity-log?startDate=2025-10-08&limit=100
 * 
 * Paginated results:
 * GET /api/user/activity-log?limit=50&offset=50
 */

