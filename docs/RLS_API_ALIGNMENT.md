# RLS and API Alignment

**Purpose:** Ensure APIs use the correct Supabase client and RLS policies match access patterns. See [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Postgres Best Practices](.agents/skills/supabase-postgres-best-practices/AGENTS.md).

## Client usage

| Client | When to use | RLS |
|--------|-------------|-----|
| **Server** (`getSupabaseServerClient`) | User-scoped reads/writes; auth checks | Enforced (anon/authenticated) |
| **Admin** (`getSupabaseAdminClient`) | Admin-only data, vote writes, system operations | Bypassed |

## API → client → tables

### Admin-only (use admin client for DB)

- **`/api/admin/dashboard`** — Overview, health, recent activity: `user_profiles`, `polls`, `votes`. Uses **admin** client for these loads; server client only for auth.
- **`/api/admin/health`** — Metrics and system status: `polls`, `feedback`, `user_profiles`, `votes`. Uses **admin** client.
- **`/api/admin/system-metrics`** — `trending_topics`, `polls`. Uses **admin** client.
- **`/api/admin/moderation/*`**, **`/api/admin/feedback/[id]/respond`**, **`/api/admin/users`**, etc. — Use **admin** client for DB where they need cross-tenant access.

### User-scoped (server client, RLS applies)

- **`/api/dashboard`** — Uses **`get_dashboard_data`** RPC only (SECURITY DEFINER). No direct table queries. **Server** client for auth + RPC.
- **`/api/polls`**, **`/api/polls/[id]`**, **`/api/polls/trending`** — Create/read/update polls; **server** client (RLS).
- **`/api/profile/*`**, **`/api/user/*`** — Own profile and user data. **Server** client.
- **`/api/v1/civics/*`** — Representative and civic data. **Server** client; representative tables have public read RLS.

### Vote flows

- **`/api/polls/[id]/vote`** — Auth and poll fetch via **server** client; writes to `votes`, `poll_rankings`, `polls` via **admin** client (bypasses RLS).
- **`/api/polls/[id]/results`** — Reads `polls`, `poll_rankings`, `votes`, `vote_integrity_scores` via **admin** client.
- **`/api/shared/vote`** — Uses **service role** (`createClient` with `SUPABASE_SERVICE_ROLE_KEY`) for poll check + vote insert; bypasses RLS.

## RLS policy rules

1. **Least privilege** — No `USING (true)` / `WITH CHECK (true)` for INSERT/UPDATE/DELETE on sensitive tables.
2. **Own-data** — Use `(select auth.uid()) = user_id` (or `created_by`, etc.) and `TO authenticated` where applicable.
3. **Admin data** — Admin-only routes use **admin** client; avoid “authenticated full access” for admin-style reads.
4. **Service role** — Keep `service_role` full access for tables written by admin/vote APIs and background jobs.

## Changes applied

- Admin dashboard, health, and system-metrics use **admin** client for DB (overview, health, metrics, recent activity).
- Dropped overly permissive RLS: **“Anyone can create polls”**, **“Anyone can update polls”**, **“Anyone can create votes”**, **“Anyone can update votes”**.
- **`/api/dashboard`** uses **`get_dashboard_data`** RPC only (no direct table queries). **`get_platform_stats`** and **`get_dashboard_data`** are SECURITY DEFINER.
- Kept: authenticated insert polls; owner update/delete polls; own-vote insert/update/delete; anon vote on shared polls; public read where needed for feeds/stats.

## Verification

- Run Security Advisor (Supabase Dashboard → Database → Advisors) and address any RLS lint.
- Use Supabase MCP `list_tables`, `execute_sql` to inspect `pg_policies` and confirm no remaining `USING (true)` for writes.
- See `RLS_VERIFICATION_GUIDE.md` and `INDEX_OPTIMIZATION_GUIDE.md` for detailed checks.
