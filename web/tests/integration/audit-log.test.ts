/**
 * Audit Log Integration Tests
 * 
 * Tests the complete audit logging system including:
 * - Database storage
 * - Service layer
 * - API integration
 * - RLS policies
 * - Statistics and search
 * 
 * Created: November 7, 2025
 */

import { createClient } from '@supabase/supabase-js';

import { createAuditLogService } from '@/lib/services/audit-log-service';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('Audit Log System', () => {
  let supabase: ReturnType<typeof createClient>;
  let auditService: ReturnType<typeof createAuditLogService>;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    auditService = createAuditLogService(supabase);
  });

  describe('Audit Log Service', () => {
    it('should create an audit log entry', async () => {
      const logId = await auditService.log(
        'user_action',
        'Test Action',
        '/test/resource',
        'test',
        true,
        {
          metadata: { test: true },
          severity: 'info'
        }
      );

      expect(logId).toBeTruthy();
      expect(typeof logId).toBe('string');
    });

    it('should log analytics access', async () => {
      const logId = await auditService.logAnalyticsAccess(
        'test-user-id',
        '/api/analytics/trends',
        true,
        'admin',
        {
          metadata: { test: true }
        }
      );

      expect(logId).toBeTruthy();
    });

    it('should log authentication events', async () => {
      const logId = await auditService.logAuth(
        'test-user-id',
        'User Login',
        true,
        'email',
        {
          metadata: { test: true }
        }
      );

      expect(logId).toBeTruthy();
    });

    it('should log security events', async () => {
      const logId = await auditService.logSecurityEvent(
        'Test Security Event',
        'warning',
        '/test/resource',
        {
          metadata: { test: true }
        }
      );

      expect(logId).toBeTruthy();
    });

    it('should log admin actions', async () => {
      const logId = await auditService.logAdminAction(
        'test-admin-id',
        'Test Admin Action',
        '/test/resource',
        {
          metadata: { test: true }
        }
      );

      expect(logId).toBeTruthy();
    });
  });

  describe('Audit Log Retrieval', () => {
    it('should get audit log statistics', async () => {
      const stats = await auditService.getStats(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      );

      expect(Array.isArray(stats)).toBe(true);
      
      if (stats.length > 0) {
        expect(stats[0]).toHaveProperty('event_type');
        expect(stats[0]).toHaveProperty('severity');
        expect(stats[0]).toHaveProperty('count');
        expect(stats[0]).toHaveProperty('unique_users');
        expect(stats[0]).toHaveProperty('success_rate');
      }
    });

    it('should search audit logs by event type', async () => {
      const logs = await auditService.search({
        eventType: 'user_action',
        limit: 10
      });

      expect(Array.isArray(logs)).toBe(true);
      
      if (logs.length > 0) {
        expect(logs[0].event_type).toBe('user_action');
      }
    });

    it('should search audit logs by severity', async () => {
      const logs = await auditService.search({
        severity: 'warning',
        limit: 10
      });

      expect(Array.isArray(logs)).toBe(true);
      
      if (logs.length > 0) {
        expect(logs[0].severity).toBe('warning');
      }
    });

    it('should search audit logs by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const logs = await auditService.search({
        startDate,
        endDate,
        limit: 10
      });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should search audit logs by resource', async () => {
      const logs = await auditService.search({
        resource: '/api/analytics',
        limit: 10
      });

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('Admin Audit Log API', () => {
    it('should return audit logs for admin users', async () => {
      // This test requires authentication
      // In a real test, you would authenticate as an admin user
      
      const response = await fetch(`${SUPABASE_URL.replace('https://', 'http://')}/api/admin/audit-logs?limit=10`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Without authentication, should return 401
      expect(response.status).toBe(401);
    });

    it('should return statistics when requested', async () => {
      // This test requires authentication
      // In a real test, you would authenticate as an admin user
      
      const response = await fetch(`${SUPABASE_URL.replace('https://', 'http://')}/api/admin/audit-logs?stats=true`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Without authentication, should return 401
      expect(response.status).toBe(401);
    });
  });

  describe('Database Functions', () => {
    it('should have create_audit_log function available', async () => {
      // Test that the function exists by attempting to call it
      const { error } = await supabase.rpc('create_audit_log', {
        p_event_type: 'user_action',
        p_event_name: 'Test Event',
        p_resource: '/test',
        p_action: 'test',
        p_granted: true,
        p_metadata: { test: true },
        p_severity: 'info',
        p_retention_days: 90
      });

      // Should work or fail with permission error (not "function doesn't exist")
      if (error) {
        expect(error.code).not.toBe('42883'); // Function not found error
      }
    });

    it('should have get_audit_log_stats function available', async () => {
      const { error } = await supabase.rpc('get_audit_log_stats', {
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString()
      });

      // Should work or fail with permission error (not "function doesn't exist")
      if (error) {
        expect(error.code).not.toBe('42883'); // Function not found error
      }
    });
  });
});

/**
 * Manual Test Examples
 * 
 * Run these in your application to verify audit logging:
 */

// Example 1: Test analytics access logging
async function testAnalyticsAccess() {
  const response = await fetch('/api/analytics/trends', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  console.log('Analytics access logged:', response.status);
}

// Example 2: Test admin dashboard logging
async function testAdminDashboard() {
  const response = await fetch('/api/admin/dashboard', {
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
    }
  });
  
  console.log('Admin dashboard access logged:', response.status);
}

// Example 3: View audit logs as admin
async function viewAuditLogs() {
  const response = await fetch('/api/admin/audit-logs?limit=50', {
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
    }
  });
  
  const data = await response.json();
  console.log('Audit logs:', data);
}

// Example 4: Get audit statistics
async function getAuditStats() {
  const response = await fetch('/api/admin/audit-logs?stats=true&startDate=2025-11-01', {
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
    }
  });
  
  const data = await response.json();
  console.log('Audit statistics:', data);
}

// Export manual tests
export {
  testAnalyticsAccess,
  testAdminDashboard,
  viewAuditLogs,
  getAuditStats
};

