/**
 * Admin Audit Logs API
 * 
 * Provides audit log viewing and searching capabilities for administrators.
 * Includes filtering, pagination, and statistics.
 * 
 * Features:
 * - List audit logs with pagination
 * - Filter by event type, severity, user, date range
 * - Get audit log statistics
 * - Search by resource
 * - Admin-only access with full audit trail
 * 
 * Created: November 7, 2025
 * Status: Production-ready
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, authError, errorResponse, forbiddenError, successResponse } from '@/lib/api';
import { logAnalyticsAccessToDatabase } from '@/lib/auth/adminGuard';
import { createAuditLogService, type AuditEventType, type AuditSeverity } from '@/lib/services/audit-log-service';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

    // Check if user is admin
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', user.id)
      .single();

    const isAdmin = (userRoleData?.roles as any)?.name === 'admin';

    if (!isAdmin) {
      // Log unauthorized access attempt
      await logAnalyticsAccessToDatabase(
        supabase,
        user,
        '/api/admin/audit-logs',
        false,
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          metadata: { reason: 'not_admin' }
        }
      );

      return forbiddenError('Admin access required');
    }

    // Log successful access
    await logAnalyticsAccessToDatabase(
      supabase,
      user,
      '/api/admin/audit-logs',
      true,
      {
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: { action: 'view_audit_logs' }
      }
    );

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const wantsStats = searchParams.get('stats') === 'true';

    // Create audit log service
    const auditLog = createAuditLogService(supabase);

    // Return statistics if requested
    if (wantsStats) {
      const startDateParam = searchParams.get('startDate');
      const startDate = startDateParam 
        ? new Date(startDateParam)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      const endDateParam = searchParams.get('endDate');
      const endDate = endDateParam
        ? new Date(endDateParam)
        : new Date();

      const stats = await auditLog.getStats(startDate, endDate);

      return successResponse({
        stats,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      });
    }

    // Search/filter audit logs
    const eventType = searchParams.get('eventType') as AuditEventType | null;
    const severity = searchParams.get('severity') as AuditSeverity | null;
    const userId = searchParams.get('userId');
    const resource = searchParams.get('resource');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      500 // Maximum 500 results
    );
    const offset = parseInt(searchParams.get('offset') || '0');

    const startDateParam = searchParams.get('startDate');
    const startDate = startDateParam
      ? new Date(startDateParam)
      : undefined;
    
    const endDateParam = searchParams.get('endDate');
    const endDate = endDateParam
      ? new Date(endDateParam)
      : undefined;

    // Build filters
    const filters: Parameters<typeof auditLog.search>[0] = {
      limit,
    };

    if (eventType) filters.eventType = eventType;
    if (severity) filters.severity = severity;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (resource) filters.resource = resource;

    // Search logs
    const logs = await auditLog.search(filters);

    // Apply offset manually (Supabase search doesn't support offset in RPC)
    const paginatedLogs = logs.slice(offset, offset + limit);

    return successResponse({
      logs: paginatedLogs,
      pagination: {
        limit,
        offset,
        total: logs.length,
        hasMore: logs.length > offset + limit
      },
      filters: {
        eventType,
        severity,
        userId,
        resource,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    });
});

/**
 * Example requests:
 * 
 * Get recent logs:
 * GET /api/admin/audit-logs?limit=50
 * 
 * Get statistics:
 * GET /api/admin/audit-logs?stats=true&startDate=2025-11-01
 * 
 * Filter by event type:
 * GET /api/admin/audit-logs?eventType=security_event&severity=critical
 * 
 * Filter by user:
 * GET /api/admin/audit-logs?userId=user-id-here&limit=100
 * 
 * Search by resource:
 * GET /api/admin/audit-logs?resource=/api/analytics
 * 
 * Date range filter:
 * GET /api/admin/audit-logs?startDate=2025-11-01&endDate=2025-11-07
 */

