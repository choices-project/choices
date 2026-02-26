# Index Optimization Guide

**Created:** January 22, 2026  
**Purpose:** Guide for reviewing and applying index recommendations from Supabase Index Advisor

---

## Overview

The Supabase Index Advisor analyzes your query patterns and suggests indexes to improve performance. This guide helps you safely review and apply those recommendations.

---

## Enabling Index Advisor

1. Open Supabase Dashboard
2. Navigate to **Observability** → **Query Performance**
3. Click **"Enable"** on the Index Advisor card
4. Wait 24-48 hours for recommendations to appear

---

## Understanding Index Recommendations

### What Indexes Do

Indexes speed up queries by creating a sorted data structure that allows fast lookups:

- **WHERE clauses** - Fast filtering
- **JOINs** - Fast table joins
- **ORDER BY** - Fast sorting
- **GROUP BY** - Fast aggregation

### Trade-offs

**Benefits:**
- ✅ Faster SELECT queries
- ✅ Faster JOINs
- ✅ Faster sorting and grouping

**Costs:**
- ⚠️ Slower INSERT/UPDATE/DELETE (indexes must be updated)
- ⚠️ Additional storage space
- ⚠️ Maintenance overhead

---

## Reviewing Recommendations

### Step 1: Review in Dashboard

1. Go to **Observability** → **Query Performance**
2. Review recommended indexes
3. Check:
   - **Table name** - Is this a frequently queried table?
   - **Columns** - Are these the right columns?
   - **Query impact** - How many queries will benefit?
   - **Storage cost** - Is the storage increase acceptable?

### Step 2: Analyze Query Patterns

**Option A — Supabase MCP (recommended):** Use `get_advisors` (performance) for index suggestions, then `apply_migration` to add indexes. No local script required.

**Option B — Review script:** Run the index-recommendations script (queries `pg_stat_statements` via `exec_sql`):

```bash
cd web
npx tsx ../scripts/review-index-recommendations.ts
```

This shows:
- Slow queries that might benefit from indexes
- Query frequency and average execution time
- Potential index candidates

### Step 3: Verify Recommendations

Before applying, verify:

1. **Table exists** - Check the table is in your schema
2. **Columns exist** - Verify column names are correct
3. **Query patterns** - Confirm the index matches actual queries
4. **Impact** - Estimate performance improvement

---

## Applying Indexes

### Method 1: Via Migration (Recommended)

Create a migration file:

```sql
-- migrate:up
-- Index: idx_polls_created_at
-- Reason: Speeds up queries filtering by created_at

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_created_at
ON public.polls
USING btree (created_at);

-- migrate:down
DROP INDEX IF EXISTS idx_polls_created_at;
```

**Why CONCURRENTLY?**
- Doesn't lock the table during creation
- Safe to run in production
- Takes longer but doesn't block queries

### Method 2: Using the Script

```typescript
import { createIndexMigration } from '../scripts/review-index-recommendations'

const migrationPath = createIndexMigration({
  table: 'polls',
  columns: ['created_at', 'is_public'],
  indexName: 'idx_polls_created_at_public',
  reason: 'Speeds up public poll queries',
})
```

### Method 3: Via Supabase Dashboard

1. Go to **Database** → **Indexes**
2. Click **"New Index"**
3. Fill in the details
4. Review and create

**Note:** Dashboard-created indexes should still be added to migrations for version control.

### Method 4: Via Supabase MCP

If using [Supabase MCP](https://mcp.supabase.com):

1. Call **`get_advisors`** (type: `performance`) for index-related recommendations.
2. Use **`apply_migration`** to run `CREATE INDEX ...` DDL. Prefer migration files in `supabase/migrations/` for version control.

See `scripts/README.md` for MCP setup.

---

## Best Practices

### 1. Start with High-Impact Indexes

Prioritize indexes that:
- Benefit many queries
- Target slow queries (>100ms)
- Are on frequently accessed tables

### 2. Test in Development First

```bash
# Apply migration locally
supabase db reset
supabase migration up

# Test query performance
# Compare before/after execution times
```

### 3. Use CONCURRENTLY in Production

Always use `CREATE INDEX CONCURRENTLY` in production:

```sql
-- ✅ Good - Safe for production
CREATE INDEX CONCURRENTLY idx_name ON table_name (column);

-- ❌ Bad - Locks table
CREATE INDEX idx_name ON table_name (column);
```

### 4. Monitor After Applying

After creating an index:

1. **Check query performance** - Are queries faster?
2. **Monitor write performance** - Are INSERTs/UPDATEs slower?
3. **Check storage** - How much space did it use?
4. **Review query plans** - Use `EXPLAIN ANALYZE`

### 5. Remove Unused Indexes

Periodically review and remove indexes that:
- Are no longer used
- Don't improve performance
- Cause significant write overhead

```sql
-- Check unused indexes
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Never used
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Common Index Patterns

### Single Column Index

```sql
CREATE INDEX CONCURRENTLY idx_polls_user_id
ON public.polls (user_id);
```

**Use when:**
- Filtering by a single column frequently
- Joining on a single column

### Composite Index

```sql
CREATE INDEX CONCURRENTLY idx_polls_user_public
ON public.polls (user_id, is_public);
```

**Use when:**
- Filtering by multiple columns together
- Order matters! Put most selective column first

### Partial Index

```sql
CREATE INDEX CONCURRENTLY idx_polls_active
ON public.polls (created_at)
WHERE is_active = true;
```

**Use when:**
- Only querying a subset of rows
- Reduces index size and maintenance

### Unique Index

```sql
CREATE UNIQUE INDEX CONCURRENTLY idx_users_email
ON public.users (email);
```

**Use when:**
- Enforcing uniqueness
- Also speeds up lookups

---

## Index Maintenance

### Rebuilding Indexes

If an index becomes bloated:

```sql
REINDEX INDEX CONCURRENTLY idx_name;
```

### Analyzing Tables

Update statistics for query planner:

```sql
ANALYZE table_name;
```

### Monitoring Index Usage

```sql
-- Index usage statistics
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Troubleshooting

### Index Not Being Used

**Possible causes:**
1. Query doesn't match index columns
2. Table statistics are outdated (run `ANALYZE`)
3. Index is less efficient than sequential scan
4. Query planner chooses different plan

**Solution:**
```sql
-- Force index usage (for testing only)
SET enable_seqscan = off;
EXPLAIN ANALYZE SELECT ...;
SET enable_seqscan = on;
```

### Slow Index Creation

**If CONCURRENTLY is slow:**
- Large tables take time
- Monitor progress: `SELECT * FROM pg_stat_progress_create_index;`
- Be patient - it's non-blocking

### Index Bloat

**Check for bloat:**
```sql
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Agent-Specific Indexes

For agent operations, consider indexes on:

### Analytics Queries

```sql
-- Agent analytics queries often filter by date ranges
CREATE INDEX CONCURRENTLY idx_analytics_events_created_at
ON public.analytics_events (created_at);

-- Agent queries often filter by agent_id
CREATE INDEX CONCURRENTLY idx_agent_operations_agent_id
ON public.agent_operations (agent_id, created_at);
```

### Vote Integrity Queries

```sql
-- Integrity analysis often queries by poll_id and user_id
CREATE INDEX CONCURRENTLY idx_votes_poll_user
ON public.votes (poll_id, user_id);

-- Integrity signals queries
CREATE INDEX CONCURRENTLY idx_integrity_signals_poll
ON public.integrity_signals (poll_id, created_at);
```

---

## Checklist for Applying Indexes

Before applying an index recommendation:

- [ ] Reviewed in Supabase Dashboard
- [ ] Verified table and columns exist
- [ ] Confirmed query patterns match
- [ ] Estimated performance improvement
- [ ] Created migration file
- [ ] Tested in development
- [ ] Reviewed storage impact
- [ ] Scheduled for low-traffic window (if not CONCURRENTLY)
- [ ] Monitored after applying

---

## Related Documentation

- [Supabase Index Advisor Docs](https://supabase.com/docs/guides/database/extensions/index-advisor)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- Postgres Best Practices skill (`.agents/skills/supabase-postgres-best-practices`) for query performance and index rules

---

**Last Updated:** January 22, 2026
