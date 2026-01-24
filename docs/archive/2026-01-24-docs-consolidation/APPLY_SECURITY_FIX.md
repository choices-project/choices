# Apply Security Fix Migration

## Quick Apply (Recommended)

The migration file is ready at:
```
supabase/migrations/20260122030000_fix_overly_permissive_rls_policies.sql
```

### Option 1: Supabase Dashboard (Easiest)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb)
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20260122030000_fix_overly_permissive_rls_policies.sql`
5. Paste into the editor
6. **Remove the `-- migrate:up` and `-- migrate:down` markers** (just the SQL between them)
7. Click **Run**

### Option 2: Supabase CLI

If you have the database password:

```bash
cd /Users/alaughingkitsune/src/Choices
supabase db push
```

This will apply all pending migrations including the security fix.

### Option 3: Extract and Run SQL Only

The SQL has been extracted to `/tmp/security_fix_ready.sql` - you can copy that directly.

## What This Migration Fixes

- ✅ Replaces "Authenticated full access" policies with properly scoped policies
- ✅ Fixes `analytics_events` - users can only access their own events
- ✅ Fixes `analytics_event_data` - users can only access their own event data  
- ✅ Fixes `bot_detection_logs` - admin-only read access
- ✅ Fixes `cache_performance_log` - admin-only read access
- ✅ Fixes `voter_registration_resources_view` - proper grants

## Verification

After applying, run this query to verify:

```sql
SELECT
  tablename,
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('analytics_events', 'analytics_event_data', 'bot_detection_logs', 'cache_performance_log')
ORDER BY tablename, policyname;
```

You should see:
- No "Authenticated full access" policies
- Properly scoped policies (insert_own, select_own, admin_read, service_full)
- Service role policies for agent access

## Expected Results

After applying, the Supabase Dashboard should show:
- ✅ Security issues reduced (from 39 to much lower)
- ✅ All tables have properly scoped RLS policies
- ✅ Service role maintains access for agents
