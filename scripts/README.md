# Scripts Directory

Utility scripts for database maintenance, index optimization, and governance. **Supabase migrations and schema work use [Supabase MCP](https://mcp.supabase.com)** (see below).

## Supabase MCP (preferred for schema/migrations)

We use **Supabase MCP** for:

- **Migrations** — `apply_migration` (DDL), `list_migrations`
- **Schema** — `list_tables`, `execute_sql`, `generate_typescript_types`
- **Advisors** — `get_advisors` (security, performance), index suggestions
- **Logs** — `get_logs` (api, postgres, auth, etc.)

Configure in `.cursor/mcp.json`; project rules prefer MCP over hand-written SQL for discovery and migrations. See `docs/RLS_API_ALIGNMENT.md` and project rules.

**Removed scripts (replaced by MCP):** `apply-security-fix-direct.ts`, `apply-security-fix.ts`, `execute-migration-via-api.ts` — they targeted a single, since-removed migration and are superseded by MCP `apply_migration`.

## Index Optimization

### review-index-recommendations.ts

Reviews slow queries (`pg_stat_statements`) and can generate index migration files.

**Usage:**
```bash
cd web
npx tsx ../scripts/review-index-recommendations.ts
```

**Features:**
- Queries slow queries from `pg_stat_statements` (via `exec_sql` RPC)
- Identifies index candidates
- Generates migration files for recommended indexes

**Alternative:** Use Supabase MCP `get_advisors` (performance) and `apply_migration` to add indexes. See `docs/INDEX_OPTIMIZATION_GUIDE.md`.

## RLS smoke test

### rls_smoke.py

Quick RLS smoke test: anon vs service_role on a configurable table. Suitable for CI.

**Usage:**
```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
  RLS_TABLE=polls RLS_SELECT=id,privacy_level \
  python3 scripts/rls_smoke.py
```

## Vercel MCP

**Yes — there is a Vercel MCP.** It provides:

- **Docs** — Search Vercel documentation
- **Projects** — List teams/projects, project details
- **Deployments** — List deployments, logs, rollbacks

**Setup:** Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "supabase": { "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF" },
    "vercel": { "url": "https://mcp.vercel.com" }
  }
}
```
Then authenticate with Vercel when prompted. See [Vercel MCP docs](https://vercel.com/docs/mcp/vercel-mcp).

**Deploy via CI only:** Disable the `deploy_to_vercel` tool in **Cursor Settings → Tools & MCP → Vercel**. Deployments are triggered by pushes to `main`.

## Other scripts

- **check-governance.js** — Governance checks
- **precommit.sh** — Pre-commit hooks
- **quarantine-future-features.sh** — Feature quarantine

## Environment variables

Scripts that need Supabase load from `web/.env.local` (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). **Never commit credentials.**

## Security notes

- Service role key = full DB access; run only in trusted environments
- Never expose service role keys in client-side code
- Review migration SQL before applying (MCP or script)
