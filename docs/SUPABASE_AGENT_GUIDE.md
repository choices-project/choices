# Supabase Agent Integration Guide

**Created:** January 22, 2026  
**Status:** ✅ Production Ready  
**Purpose:** Comprehensive guide for AI agents to securely interact with Supabase

---

## 🎯 Overview

This guide provides best practices, patterns, and examples for AI agents to interact with Supabase in the Choices platform. The agent system provides secure, audited, and rate-limited access to the database with proper context management.

### Key Features

- **Automatic Audit Logging**: All agent operations are logged for security and debugging
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Context Management**: Track agent identity, version, and purpose
- **Security**: Proper use of service role vs authenticated clients
- **Error Handling**: Comprehensive error handling and logging

---

## 📚 Table of Contents

1. [When to Use Agents](#when-to-use-agents)
2. [Client Selection](#client-selection)
3. [Basic Usage](#basic-usage)
4. [Advanced Patterns](#advanced-patterns)
5. [Security Considerations](#security-considerations)
6. [RLS Policies](#rls-policies)
7. [Audit Logging](#audit-logging)
8. [Rate Limiting](#rate-limiting)
9. [Error Handling](#error-handling)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## When to Use Agents

Agents should be used for:

- ✅ **Analytics Operations**: Analyzing poll results, vote patterns, user behavior
- ✅ **Integrity Analysis**: Bot detection, vote integrity scoring, anomaly detection
- ✅ **Data Processing**: Bulk operations, data synchronization, ETL tasks
- ✅ **Automated Tasks**: Scheduled jobs, background processing
- ✅ **Admin Operations**: System maintenance, data cleanup, reporting

Agents should NOT be used for:

- ❌ **User-Facing Operations**: Direct user interactions should use regular server clients
- ❌ **Real-Time Operations**: Operations requiring immediate user feedback
- ❌ **Operations Without Context**: Always provide agent identity and purpose

---

## Client Selection

### Service Role vs Authenticated Client

**Use Service Role (`useServiceRole: true`)** when:
- You need elevated permissions
- Accessing data across multiple users
- Performing system-level operations
- Analytics and integrity analysis
- Admin operations

**Use Authenticated Client (`useServiceRole: false`)** when:
- Operating on behalf of a specific user
- User context is available
- Operations should respect user-level RLS policies
- User-specific data operations

### Example: Choosing the Right Client

```typescript
// ✅ Analytics agent - needs service role for cross-user analysis
const analyticsAgent = await getSupabaseAgentClient({
  agentId: 'analytics-agent',
  purpose: 'Analyze poll results across all users',
  useServiceRole: true, // Required for cross-user access
})

// ✅ User agent - uses authenticated client for user-specific operations
const userAgent = await getSupabaseAgentClient({
  agentId: 'user-agent',
  purpose: 'Update user preferences',
  useServiceRole: false, // Uses user session
  userId: user.id,
})
```

---

## Basic Usage

### Creating an Agent Client

```typescript
import { getSupabaseAgentClient } from '@/utils/supabase/agent'

// Basic agent client
const agent = await getSupabaseAgentClient({
  agentId: 'my-agent',
  agentVersion: '1.0.0',
  purpose: 'Analyze poll data',
  useServiceRole: true,
  enableAudit: true,
})

// Use the client
const { data, error } = await agent.client
  .from('polls')
  .select('*')
  .eq('id', pollId)
```

### Using Helper Functions

```typescript
import {
  getAnalyticsAgentClient,
  getIntegrityAgentClient,
  getUserAgentClient,
} from '@/utils/supabase/agent'

// Analytics operations
const analyticsAgent = await getAnalyticsAgentClient()
const { data: polls } = await analyticsAgent.client
  .from('polls')
  .select('*, poll_options(*)')

// Integrity operations
const integrityAgent = await getIntegrityAgentClient()
const { data: votes } = await integrityAgent.client
  .from('votes')
  .select('*')
  .eq('poll_id', pollId)

// User operations
const userAgent = await getUserAgentClient(userId)
const { data: profile } = await userAgent.client
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single()
```

---

## Advanced Patterns

### Custom Rate Limiting

```typescript
const agent = await getSupabaseAgentClient({
  agentId: 'bulk-processor',
  purpose: 'Process large batches of data',
  useServiceRole: true,
  rateLimit: {
    maxRequests: 1000, // Higher limit for bulk operations
    windowMs: 60 * 1000, // 1 minute window
  },
})
```

### Manual Operation Logging

```typescript
const agent = await getSupabaseAgentClient({
  agentId: 'custom-agent',
  purpose: 'Custom operation',
})

// Perform operation
const { data, error } = await agent.client
  .from('polls')
  .select('*')

// Manually log if needed (usually automatic)
await agent.logOperation(
  {
    operationType: 'SELECT',
    tableName: 'polls',
  },
  {
    status: error ? 'error' : 'success',
    error: error?.message,
    rowCount: data?.length,
  }
)
```

### Context Enrichment

```typescript
import { enrichAgentContext } from '@/lib/core/agent/context'

const agent = await getSupabaseAgentClient({
  agentId: 'analytics-agent',
  purpose: 'Analyze poll results',
})

// Enrich context with additional metadata
const enrichedContext = enrichAgentContext(agent.context, {
  pollId: 'poll-123',
  analysisType: 'sentiment',
  timestamp: new Date().toISOString(),
})
```

---

## Security Considerations

### 1. Never Expose Service Role Key

```typescript
// ❌ WRONG - Never do this
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const client = createClient(url, serviceKey) // Exposed in client code

// ✅ CORRECT - Use agent client utility
const agent = await getSupabaseAgentClient({
  agentId: 'my-agent',
  useServiceRole: true, // Handled securely server-side
})
```

### 2. Always Provide Agent Identity

```typescript
// ❌ WRONG - Missing agent identity
const agent = await getSupabaseAgentClient({
  agentId: '', // Empty or missing
})

// ✅ CORRECT - Clear agent identity
const agent = await getSupabaseAgentClient({
  agentId: 'analytics-agent',
  agentVersion: '1.0.0',
  purpose: 'Analyze poll results',
})
```

### 3. Sanitize Sensitive Data

The agent client automatically sanitizes sensitive fields (passwords, tokens, secrets) in audit logs. However, be careful with data you pass:

```typescript
// ✅ GOOD - No sensitive data
const { data } = await agent.client
  .from('polls')
  .select('id, question, created_at')

// ⚠️ CAUTION - Contains user data
const { data } = await agent.client
  .from('user_profiles')
  .select('*') // May contain sensitive fields
```

### 4. Use Least Privilege

```typescript
// ❌ WRONG - Full access when read-only needed
const agent = await getSupabaseAgentClient({
  agentId: 'read-only-agent',
  useServiceRole: true, // Full access
})

// ✅ CORRECT - Use authenticated client for user-scoped reads
const agent = await getSupabaseAgentClient({
  agentId: 'read-only-agent',
  useServiceRole: false, // Respects RLS
  userId: user.id,
})
```

---

## RLS Policies

### Understanding Service Role and RLS

**Important**: Service role bypasses RLS by default. However, we create explicit policies to:
1. Document intent
2. Provide fallback if RLS enforcement changes
3. Enable future role-based agent access

### Agent-Accessible Tables

The following tables have explicit service_role policies for agent access:

- `polls` - Read/write for analysis
- `votes` - Read for integrity analysis
- `poll_rankings` - Read/write for vote processing
- `vote_integrity_scores` - Read/write for integrity analysis
- `integrity_signals` - Read/write for bot detection
- `analytics_events` - Write for analytics
- `analytics_event_data` - Write for analytics
- `bot_detection_logs` - Write for bot detection
- `user_profiles` - Read-only for context (no PII exposure)
- `poll_options` - Read for analysis

### Verifying RLS Policies

```sql
-- Check service role policies
SELECT
  tablename,
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND 'service_role' = ANY(roles)
ORDER BY tablename, policyname;
```

---

## Audit Logging

### Automatic Logging

All agent operations are automatically logged to the `agent_operations` table:

```typescript
// This operation is automatically logged
const { data } = await agent.client
  .from('polls')
  .select('*')
```

### Querying Audit Logs

```typescript
import { queryAgentOperations } from '@/lib/core/agent/audit'

// Query operations by agent
const operations = await queryAgentOperations({
  agentId: 'analytics-agent',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  limit: 100,
})

// Get operation statistics
import { getAgentOperationStats } from '@/lib/core/agent/audit'

const stats = await getAgentOperationStats('analytics-agent', {
  start: '2026-01-01',
  end: '2026-01-31',
})

console.log({
  total: stats.total,
  success: stats.success,
  errors: stats.errors,
  averageDuration: stats.averageDuration,
})
```

### Audit Log Schema

```sql
CREATE TABLE agent_operations (
  id UUID PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_version TEXT,
  operation_type TEXT NOT NULL,
  table_name TEXT,
  function_name TEXT,
  user_context UUID,
  request_metadata JSONB,
  result_status TEXT NOT NULL,
  error_message TEXT,
  row_count INTEGER,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Rate Limiting

### Default Rate Limits

Helper functions include sensible defaults:

- **Analytics Agent**: 100 requests/minute
- **Integrity Agent**: 50 requests/minute
- **User Agent**: 200 requests/minute

### Custom Rate Limits

```typescript
const agent = await getSupabaseAgentClient({
  agentId: 'high-volume-agent',
  rateLimit: {
    maxRequests: 500, // Custom limit
    windowMs: 60 * 1000, // 1 minute
  },
})
```

### Handling Rate Limit Errors

```typescript
try {
  const { data } = await agent.client
    .from('polls')
    .select('*')
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Handle rate limit
    console.log('Rate limit hit, retrying later...')
    // Implement exponential backoff
  }
}
```

---

## Error Handling

### Best Practices

```typescript
const agent = await getSupabaseAgentClient({
  agentId: 'my-agent',
  purpose: 'Process data',
})

try {
  const { data, error } = await agent.client
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (error) {
    // Log error (already logged automatically)
    logger.error('Agent operation failed', {
      agentId: agent.context.agentId,
      error: error.message,
    })
    throw error
  }

  return data
} catch (error) {
  // Errors are automatically logged to audit system
  // Handle appropriately for your use case
  throw error
}
```

### Error Types

- **Rate Limited**: `status: 'rate_limited'` - Too many requests
- **Error**: `status: 'error'` - Operation failed
- **Unauthorized**: `status: 'unauthorized'` - Permission denied
- **Success**: `status: 'success'` - Operation completed

---

## Testing

### Unit Tests

```typescript
import { getSupabaseAgentClient } from '@/utils/supabase/agent'

describe('Agent Client', () => {
  it('should create agent client with service role', async () => {
    const agent = await getSupabaseAgentClient({
      agentId: 'test-agent',
      useServiceRole: true,
    })

    expect(agent.client).toBeDefined()
    expect(agent.context.agentId).toBe('test-agent')
  })

  it('should log operations automatically', async () => {
    const agent = await getSupabaseAgentClient({
      agentId: 'test-agent',
      enableAudit: true,
    })

    await agent.client.from('polls').select('id').limit(1)

    // Verify operation was logged
    const operations = await queryAgentOperations({
      agentId: 'test-agent',
      limit: 1,
    })

    expect(operations.length).toBeGreaterThan(0)
    expect(operations[0].resultStatus).toBe('success')
  })
})
```

### Integration Tests

```typescript
describe('Agent Operations', () => {
  it('should perform analytics operation', async () => {
    const agent = await getAnalyticsAgentClient()

    const { data, error } = await agent.client
      .from('polls')
      .select('*, poll_options(*)')
      .eq('id', testPollId)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

---

## Troubleshooting

### Common Issues

#### 1. "Missing Supabase admin environment variables"

**Problem**: Service role key not configured

**Solution**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables

```bash
# Check environment
echo $SUPABASE_SERVICE_ROLE_KEY

# Set in .env.local
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 2. "Rate limit exceeded"

**Problem**: Too many requests in time window

**Solution**: 
- Increase rate limit configuration
- Implement exponential backoff
- Batch operations

```typescript
// Increase rate limit
const agent = await getSupabaseAgentClient({
  agentId: 'my-agent',
  rateLimit: {
    maxRequests: 200, // Increase from default
    windowMs: 60 * 1000,
  },
})
```

#### 3. "Permission denied" or RLS errors

**Problem**: RLS policy blocking access

**Solution**:
- Verify service_role policy exists for table
- Check if using correct client type (service role vs authenticated)
- Review RLS policies in Supabase dashboard

```sql
-- Check policies
SELECT * FROM pg_policies
WHERE tablename = 'your_table'
  AND 'service_role' = ANY(roles);
```

#### 4. Audit logs not appearing

**Problem**: Operations not being logged

**Solution**:
- Verify `enableAudit` is not set to `false`
- Check `agent_operations` table exists
- Verify service role has INSERT permission on `agent_operations`

```typescript
// Ensure audit is enabled
const agent = await getSupabaseAgentClient({
  agentId: 'my-agent',
  enableAudit: true, // Explicitly enable
})
```

---

## Best Practices Summary

1. ✅ **Always provide agent identity** - Use descriptive `agentId` and `purpose`
2. ✅ **Use appropriate client type** - Service role for system ops, authenticated for user ops
3. ✅ **Enable audit logging** - Keep `enableAudit: true` unless explicitly needed off
4. ✅ **Set appropriate rate limits** - Prevent abuse and ensure fair resource usage
5. ✅ **Handle errors gracefully** - Errors are logged automatically, handle appropriately
6. ✅ **Use helper functions** - `getAnalyticsAgentClient()`, etc. for common patterns
7. ✅ **Query audit logs** - Monitor agent operations for security and debugging
8. ✅ **Test thoroughly** - Unit and integration tests for agent operations
9. ✅ **Document purpose** - Clear `purpose` field helps with audit trail
10. ✅ **Respect user privacy** - Don't expose PII in logs or operations

---

## Related Documentation

- [Security Guide](./SECURITY.md) - Overall security architecture
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Required configuration
- [RLS Verification Guide](../RLS_VERIFICATION_GUIDE.md) - RLS policy verification
- [Architecture Guide](./ARCHITECTURE.md) - System architecture

---

## Support

For questions or issues with agent integration:

1. Check this guide and troubleshooting section
2. Review audit logs for error details
3. Verify RLS policies are correctly configured
4. Check Supabase dashboard for security issues
5. Review application logs for detailed error messages

---

**Last Updated**: January 22, 2026
