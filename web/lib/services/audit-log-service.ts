/**
 * Audit Log Service
 * 
 * Service layer for creating and querying audit logs.
 * Provides type-safe interface to the audit_logs table and functions.
 * 
 * Features:
 * - Type-safe audit log creation
 * - Automatic metadata enrichment
 * - Statistics and reporting
 * - Integration with Supabase RLS
 * 
 * Created: November 7, 2025
 * Status: Production-ready
 */

import { logger } from '@/lib/utils/logger';

import type { SupabaseClient } from '@supabase/supabase-js';


// ============================================================================
// Types
// ============================================================================

export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'analytics_access'
  | 'admin_action'
  | 'security_event'
  | 'system_event'
  | 'user_action';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditLogEntry = {
  id?: string;
  event_type: AuditEventType;
  event_name: string;
  severity?: AuditSeverity;
  user_id?: string | null;
  session_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_path?: string | null;
  request_method?: string | null;
  resource?: string | null;
  action?: string | null;
  status?: string;
  granted?: boolean | null;
  metadata?: Record<string, unknown>;
  error_message?: string | null;
  error_stack?: string | null;
  created_at?: string;
  expires_at?: string | null;
};

export type AuditLogStats = {
  event_type: AuditEventType;
  severity: AuditSeverity;
  count: number;
  unique_users: number;
  success_rate: number;
};

export type AuditLogOptions = {
  retentionDays?: number;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
};

// ============================================================================
// Audit Log Service Class
// ============================================================================

export class AuditLogService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create an audit log entry
   * 
   * @param eventType - Type of event being logged
   * @param eventName - Human-readable event name
   * @param resource - Resource being accessed (e.g., API endpoint)
   * @param action - Action being performed
   * @param granted - Whether access was granted
   * @param options - Additional options
   * @returns Audit log ID or null if failed
   * 
   * @example
   * ```typescript
   * await auditLog.log(
   *   'analytics_access',
   *   'Dashboard Viewed',
   *   '/api/analytics/dashboard',
   *   'view',
   *   true,
   *   { metadata: { dashboard_id: 'main' } }
   * );
   * ```
   */
  async log(
    eventType: AuditEventType,
    eventName: string,
    resource?: string,
    action?: string,
    granted?: boolean,
    options: AuditLogOptions = {}
  ): Promise<string | null> {
    try {
      // In E2E test environments, gracefully handle failures
      const isE2E = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || 
                    process.env.PLAYWRIGHT_USE_MOCKS === '1';
      
      const { data, error } = await this.supabase.rpc('create_audit_log', {
        p_event_type: eventType,
        p_event_name: eventName,
        p_resource: resource,
        p_action: action,
        p_granted: granted,
        p_metadata: options.metadata || {},
        p_severity: options.severity || 'info',
        p_ip_address: options.ipAddress,
        p_user_agent: options.userAgent,
        p_retention_days: options.retentionDays || 90,
      });

      if (error) {
        // In E2E mode, log but don't throw - audit logs are non-critical for tests
        if (isE2E) {
          logger.warn('Audit log creation failed in E2E mode (non-critical)', {
            eventType,
            eventName,
            error: error.message,
          });
          return null;
        }
        logger.error('Failed to create audit log', { error, eventType, eventName });
        return null;
      }

      return data as string;
    } catch (error) {
      // In E2E mode, gracefully handle errors - audit logs are non-critical for tests
      const isE2E = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || 
                    process.env.PLAYWRIGHT_USE_MOCKS === '1';
      
      if (isE2E) {
        logger.warn('Audit log creation error in E2E mode (non-critical)', {
          eventType,
          eventName,
          error: error instanceof Error ? error.message : String(error),
        });
      } else {
      logger.error('Error creating audit log', { error, eventType, eventName });
      }
      return null;
    }
  }

  /**
   * Log analytics access event
   * 
   * @param userId - User ID accessing analytics
   * @param resource - Analytics resource accessed
   * @param granted - Whether access was granted
   * @param role - User's role
   * @param options - Additional options
   */
  async logAnalyticsAccess(
    userId: string | null,
    resource: string,
    granted: boolean,
    role?: string,
    options: AuditLogOptions = {}
  ): Promise<string | null> {
    const metadata = mergeDefined(options.metadata ?? {}, {
      userId,
      role,
      type: 'analytics_access',
    });

    const mergedOptions = mergeDefined(options as Record<string, unknown>, {
      metadata,
      severity: granted ? 'info' : 'warning',
    }) as AuditLogOptions;

    return this.log(
      'analytics_access',
      granted ? 'Analytics Access Granted' : 'Analytics Access Denied',
      resource,
      'access',
      granted,
      mergedOptions
    );
  }

  /**
   * Log authentication event
   * 
   * @param userId - User ID (null for failed attempts)
   * @param eventName - Authentication event name
   * @param success - Whether authentication succeeded
   * @param method - Authentication method used
   * @param options - Additional options
   */
  async logAuth(
    userId: string | null,
    eventName: string,
    success: boolean,
    method?: string,
    options: AuditLogOptions = {}
  ): Promise<string | null> {
    const metadata = mergeDefined(options.metadata ?? {}, {
      method,
      success,
      userId: userId ?? 'anonymous', // Include userId in metadata for audit trail
    });

    const mergedOptions = mergeDefined(options as Record<string, unknown>, {
      metadata,
      severity: success ? 'info' : 'warning',
    }) as AuditLogOptions;

    return this.log(
      'authentication',
      eventName,
      '/api/auth',
      method || 'unknown',
      success,
      mergedOptions
    );
  }

  /**
   * Log security event
   * 
   * @param eventName - Security event name
   * @param severity - Event severity
   * @param resource - Resource involved
   * @param options - Additional options
   */
  async logSecurityEvent(
    eventName: string,
    severity: AuditSeverity,
    resource?: string,
    options: AuditLogOptions = {}
  ): Promise<string | null> {
    const mergedOptions = mergeDefined(options as Record<string, unknown>, {
      severity,
    }) as AuditLogOptions;

    return this.log(
      'security_event',
      eventName,
      resource,
      'security',
      undefined,
      mergedOptions
    );
  }

  /**
   * Log admin action
   * 
   * @param userId - Admin user ID
   * @param action - Action performed
   * @param resource - Resource acted upon
   * @param options - Additional options
   */
  async logAdminAction(
    userId: string,
    action: string,
    resource?: string,
    options: AuditLogOptions = {}
  ): Promise<string | null> {
    const metadata = mergeDefined(options.metadata ?? {}, {
      adminUserId: userId,
    });

    const mergedOptions = mergeDefined(options as Record<string, unknown>, {
      metadata,
      severity: 'info',
    }) as AuditLogOptions;

    return this.log(
      'admin_action',
      action,
      resource,
      'admin',
      true,
      mergedOptions
    );
  }

  /**
   * Get audit logs for current user
   * 
   * @param limit - Maximum number of logs to return
   * @param offset - Number of logs to skip
   * @returns Array of audit log entries
   */
  async getUserLogs(
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to fetch user audit logs', { error });
        return [];
      }

      return data as AuditLogEntry[];
    } catch (error) {
      logger.error('Error fetching user audit logs', { error });
      return [];
    }
  }

  /**
   * Get audit log statistics
   * 
   * @param startDate - Start date for stats
   * @param endDate - End date for stats
   * @returns Array of audit log statistics
   */
  async getStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditLogStats[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_audit_log_stats', {
        p_start_date: startDate?.toISOString(),
        p_end_date: endDate?.toISOString(),
      });

      if (error) {
        logger.error('Failed to fetch audit log stats', { error });
        return [];
      }

      return data as AuditLogStats[];
    } catch (error) {
      logger.error('Error fetching audit log stats', { error });
      return [];
    }
  }

  /**
   * Search audit logs (admin only)
   * 
   * @param filters - Search filters
   * @returns Array of matching audit log entries
   */
  async search(filters: {
    eventType?: AuditEventType;
    severity?: AuditSeverity;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    resource?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      if (filters.resource) {
        query = query.ilike('resource', `%${filters.resource}%`);
      }

      query = query.limit(filters.limit || 100);

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to search audit logs', { error, filters });
        return [];
      }

      return data as AuditLogEntry[];
    } catch (error) {
      logger.error('Error searching audit logs', { error, filters });
      return [];
    }
  }
}

const mergeDefined = <T extends Record<string, unknown>>(
  base: T,
  extras?: Record<string, unknown>,
): T => {
  const result: Record<string, unknown> = { ...base };
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (value !== undefined) {
        result[key] = value;
      } else {
        delete result[key];
      }
    }
  }
  return result as T;
};

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an audit log service instance
 * 
 * @param supabase - Supabase client instance
 * @returns AuditLogService instance
 */
export function createAuditLogService(supabase: SupabaseClient): AuditLogService {
  return new AuditLogService(supabase);
}

/**
 * Helper to log analytics access directly
 * Convenience wrapper around the service
 */
export async function logAnalyticsAccess(
  supabase: SupabaseClient,
  userId: string | null,
  resource: string,
  granted: boolean,
  role?: string,
  options?: AuditLogOptions
): Promise<void> {
  const service = createAuditLogService(supabase);
  await service.logAnalyticsAccess(userId, resource, granted, role, options);
}

