# Audit Log Usage Guide
**Date:** November 7, 2025  
**Status:** Production-Ready

## Overview

The audit log system provides comprehensive tracking of all significant system events for security, compliance, and monitoring purposes. This guide explains how to use the audit logging infrastructure effectively.

---

## Quick Start

### 1. Basic Usage in API Routes

```typescript
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logAnalyticsAccessToDatabase } from '@/lib/auth/adminGuard';

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check authorization
  const isAuthorized = checkUserPermissions(user);
  
  // Log the access attempt
  await logAnalyticsAccessToDatabase(
    supabase,
    user,
    '/api/analytics/dashboard',
    isAuthorized,
    {
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      metadata: { dashboard_type: 'main' }
    }
  );
  
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // ... rest of handler
}
```

### 2. Using the Audit Log Service Directly

```typescript
import { createAuditLogService } from '@/lib/services/audit-log-service';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const auditLog = createAuditLogService(supabase);
  
  try {
    // Perform sensitive operation
    await deletePoll(pollId);
    
    // Log successful admin action
    await auditLog.logAdminAction(
      userId,
      'Delete Poll',
      `/api/polls/${pollId}`,
      {
        metadata: { poll_id: pollId, reason: 'policy violation' },
        severity: 'info'
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log failed action
    await auditLog.logSecurityEvent(
      'Failed Poll Deletion',
      'error',
      `/api/polls/${pollId}`,
      {
        metadata: { error: error.message, poll_id: pollId }
      }
    );
    
    throw error;
  }
}
```

---

## Event Types

### 1. Authentication Events
```typescript
await auditLog.logAuth(
  userId,
  'User Login',
  true, // success
  'email',
  {
    ipAddress: request.headers.get('x-forwarded-for'),
    metadata: { login_method: 'password' }
  }
);
```

**Use Cases:**
- Login attempts (success/failure)
- Logout events
- Password changes
- MFA events
- Session creation/destruction

### 2. Analytics Access
```typescript
await auditLog.logAnalyticsAccess(
  userId,
  '/api/analytics/trends',
  true, // granted
  'admin',
  {
    metadata: { 
      timeRange: '30d',
      filters: ['demographics']
    }
  }
);
```

**Use Cases:**
- Dashboard views
- Report generation
- Data exports
- Chart rendering
- Admin panel access

### 3. Security Events
```typescript
await auditLog.logSecurityEvent(
  'Rate Limit Exceeded',
  'warning',
  '/api/auth/login',
  {
    ipAddress: clientIp,
    metadata: {
      attempts: 5,
      window: '5m'
    }
  }
);
```

**Use Cases:**
- Rate limit violations
- Suspicious access patterns
- Failed authorization attempts
- CORS violations
- Invalid tokens

### 4. Admin Actions
```typescript
await auditLog.logAdminAction(
  adminUserId,
  'Ban User',
  `/api/admin/users/${targetUserId}`,
  {
    metadata: {
      target_user: targetUserId,
      reason: 'spam',
      duration: '30d'
    },
    severity: 'warning'
  }
);
```

**Use Cases:**
- User management (ban, unban, delete)
- Content moderation
- System configuration changes
- Permission updates
- Feature flag changes

### 5. Data Modifications
```typescript
await auditLog.log(
  'data_modification',
  'Poll Updated',
  `/api/polls/${pollId}`,
  'update',
  true,
  {
    metadata: {
      poll_id: pollId,
      changes: ['title', 'options'],
      previous_title: 'Old Title'
    }
  }
);
```

**Use Cases:**
- Database record updates
- Bulk operations
- Data imports/exports
- Schema migrations
- Cache invalidations

---

## Querying Audit Logs

### 1. Get User's Audit Trail
```typescript
const auditLog = createAuditLogService(supabase);

// Get recent logs for current user
const logs = await auditLog.getUserLogs(50, 0);

// Paginated results
const nextPage = await auditLog.getUserLogs(50, 50);
```

### 2. Get Statistics
```typescript
// Get last 7 days of stats
const stats = await auditLog.getStats(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
);

// Returns:
// [{
//   event_type: 'analytics_access',
//   severity: 'info',
//   count: 150,
//   unique_users: 25,
//   success_rate: 98.67
// }, ...]
```

### 3. Search Audit Logs (Admin Only)
```typescript
const auditLog = createAuditLogService(supabase);

// Search by event type
const securityEvents = await auditLog.search({
  eventType: 'security_event',
  severity: 'critical',
  startDate: new Date('2025-11-01'),
  limit: 100
});

// Search by user
const userActivity = await auditLog.search({
  userId: 'user-id-here',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
});

// Search by resource
const apiAccess = await auditLog.search({
  resource: '/api/analytics',
  limit: 50
});
```

---

## Best Practices

### 1. Always Log Security-Sensitive Operations
```typescript
✅ DO: Log all authentication attempts
✅ DO: Log authorization decisions
✅ DO: Log admin actions
✅ DO: Log data exports
✅ DO: Log permission changes

❌ DON'T: Log regular page views
❌ DON'T: Log every API call
❌ DON'T: Log sensitive data in metadata
```

### 2. Use Appropriate Severity Levels
```typescript
// Info - Normal operations
await auditLog.log(..., { severity: 'info' });

// Warning - Suspicious but not critical
await auditLog.log(..., { severity: 'warning' });

// Error - Failed operations
await auditLog.log(..., { severity: 'error' });

// Critical - Security incidents
await auditLog.logSecurityEvent(
  'Potential Account Takeover',
  'critical',
  ...
);
```

### 3. Include Context in Metadata
```typescript
// Good: Rich context
await auditLog.log('admin_action', 'User Banned', `/api/users/${userId}`, 'ban', true, {
  metadata: {
    target_user_id: userId,
    target_user_email: userEmail,
    ban_reason: 'Spam',
    ban_duration: '30 days',
    reported_by: reporterIds,
    violation_count: 5
  }
});

// Bad: Minimal context
await auditLog.log('admin_action', 'User Banned', null, null, true);
```

### 4. Log Both Success and Failure
```typescript
try {
  await performSensitiveOperation();
  
  // Log success
  await auditLog.log('data_modification', 'Operation Succeeded', ...);
} catch (error) {
  // Log failure
  await auditLog.logSecurityEvent(
    'Operation Failed',
    'error',
    resource,
    { metadata: { error: error.message } }
  );
  
  throw error;
}
```

---

## Retention and Cleanup

### Automatic Retention
Audit logs automatically expire based on retention period (default: 90 days).

```typescript
// Set custom retention (30 days)
await auditLog.log(..., {
  retentionDays: 30
});

// Keep forever
await auditLog.log(..., {
  retentionDays: 0
});
```

### Manual Cleanup
Run the cleanup function periodically (e.g., via cron job):

```sql
-- Run in Supabase SQL Editor or scheduled job
SELECT public.cleanup_expired_audit_logs();
-- Returns: number of deleted logs
```

### Recommended Retention Periods
- **Authentication events:** 90 days
- **Security events:** 365 days (1 year)
- **Admin actions:** 365 days (1 year)
- **Analytics access:** 30 days
- **User actions:** 90 days

---

## Compliance Considerations

### GDPR Compliance
```typescript
// Log data subject access requests
await auditLog.log(
  'user_action',
  'Data Export Requested',
  '/api/profile/export',
  'export',
  true,
  { metadata: { request_type: 'GDPR_SAR' } }
);

// Log data deletion
await auditLog.log(
  'data_modification',
  'User Data Deleted',
  `/api/profile/${userId}`,
  'delete',
  true,
  { 
    metadata: { 
      deletion_type: 'GDPR_Right_to_be_Forgotten',
      data_types: ['profile', 'votes', 'comments']
    }
  }
);
```

### SOC 2 Compliance
```typescript
// Log access to sensitive data
await auditLog.log(
  'data_access',
  'PII Access',
  '/api/admin/users/pii',
  'view',
  true,
  {
    metadata: {
      accessed_fields: ['email', 'phone', 'address'],
      purpose: 'Customer Support Request #12345'
    }
  }
);
```

---

## Performance Considerations

### 1. Async Logging (Fire and Forget)
```typescript
// Don't await if not critical to user experience
auditLog.log('user_action', 'Page View', ...).catch(err => {
  logger.error('Failed to create audit log', err);
});
```

### 2. Batch Operations
```typescript
// For bulk operations, log once with summary
await auditLog.log(
  'data_modification',
  'Bulk User Import',
  '/api/admin/import',
  'import',
  true,
  {
    metadata: {
      total_users: 1000,
      successful: 985,
      failed: 15,
      duration_ms: 5432
    }
  }
);
```

### 3. Use Indexes
The audit log table has optimized indexes for:
- User lookups: `user_id + created_at`
- Event type filtering: `event_type + created_at`
- Severity filtering: `severity + created_at`
- Resource searches: `resource + created_at`

---

## Monitoring and Alerts

### Example: Monitor Failed Login Attempts
```typescript
// Query in dashboard
const failedLogins = await auditLog.search({
  eventType: 'authentication',
  startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
});

const failedCount = failedLogins.filter(log => !log.granted).length;

if (failedCount > 10) {
  // Alert security team
  await sendAlert('High number of failed login attempts', failedCount);
}
```

### Example: Track Admin Actions
```typescript
const stats = await auditLog.getStats();
const adminActions = stats.find(s => s.event_type === 'admin_action');

console.log(`Admin actions in last 7 days: ${adminActions?.count || 0}`);
console.log(`Unique admins active: ${adminActions?.unique_users || 0}`);
```

---

## Troubleshooting

### Issue: Audit logs not appearing
**Solutions:**
1. Check RLS policies are enabled
2. Verify service role permissions
3. Check user authentication status
4. Review Supabase logs for errors

### Issue: Performance degradation
**Solutions:**
1. Ensure indexes are created
2. Run cleanup function regularly
3. Use appropriate retention periods
4. Consider archiving old logs to separate table

### Issue: Metadata not storing correctly
**Solutions:**
1. Ensure metadata is valid JSON
2. Check for circular references
3. Keep metadata reasonably sized (< 1MB)
4. Use proper TypeScript types

---

## Examples

### Complete API Route with Audit Logging
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { createAuditLogService } from '@/lib/services/audit-log-service';
import { isAdmin } from '@/lib/auth/adminGuard';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const auditLog = createAuditLogService(supabase);
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    await auditLog.logSecurityEvent(
      'Unauthorized Delete Attempt',
      'warning',
      `/api/polls/${(await params).id}`,
      {
        ipAddress: request.headers.get('x-forwarded-for'),
        metadata: { poll_id: (await params).id }
      }
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check authorization
  const authorized = isAdmin(user);
  if (!authorized) {
    await auditLog.logAnalyticsAccess(
      user.id,
      `/api/polls/${(await params).id}`,
      false,
      'user',
      {
        ipAddress: request.headers.get('x-forwarded-for'),
        metadata: { attempted_action: 'delete', poll_id: (await params).id }
      }
    );
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    // Perform deletion
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', (await params).id);
    
    if (error) throw error;
    
    // Log successful deletion
    await auditLog.logAdminAction(
      user.id,
      'Poll Deleted',
      `/api/polls/${(await params).id}`,
      {
        metadata: { 
          poll_id: (await params).id,
          deleted_by: user.email,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log failed deletion
    await auditLog.logSecurityEvent(
      'Poll Deletion Failed',
      'error',
      `/api/polls/${(await params).id}`,
      {
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          poll_id: (await params).id,
          user_id: user.id
        }
      }
    );
    
    return NextResponse.json(
      { error: 'Failed to delete poll' },
      { status: 500 }
    );
  }
}
```

---

## Summary

The audit log system provides:
- ✅ Comprehensive event tracking
- ✅ Type-safe TypeScript API
- ✅ Flexible metadata storage
- ✅ Automatic retention management
- ✅ Admin and user access control
- ✅ Performance-optimized queries
- ✅ Compliance-ready logging

Use it to track all security-sensitive operations and maintain a complete audit trail for your application.

For more information, see:
- Database migration: `supabase/migrations/20251107000001_audit_logs.sql`
- Service layer: `lib/services/audit-log-service.ts`
- Integration: `lib/auth/adminGuard.tsx`

