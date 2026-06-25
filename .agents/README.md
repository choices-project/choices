# Agent resources (`.agents/`)

Canonical guidance for AI assistants working in Choices. **Human contributors:** start with [`docs/GETTING_STARTED.md`](../docs/GETTING_STARTED.md) and [`docs/AGENT_SETUP.md`](../docs/AGENT_SETUP.md).

---

## Start here by task

| Task | Read first |
|------|------------|
| **Auth, profile, trust tier, admin, RLS, security migrations** | **[`AUTH_SECURITY_HANDOFF.md`](AUTH_SECURITY_HANDOFF.md)** |
| Implementation backlog (P0 RPC/RLS, audit §16) | [`scratch/AUTH_OVERHAUL_PLAN.md`](../scratch/AUTH_OVERHAUL_PLAN.md) |
| MCP servers, smoke tests, deploy policy | [`docs/AGENT_SETUP.md`](../docs/AGENT_SETUP.md) |
| React / Next.js performance | [`skills/vercel-react-best-practices/SKILL.md`](skills/vercel-react-best-practices/SKILL.md) |
| Postgres / Supabase / RLS performance | [`skills/supabase-postgres-best-practices/SKILL.md`](skills/supabase-postgres-best-practices/SKILL.md) |
| Root commands, env, CI | [`AGENTS.md`](../AGENTS.md) |
| Always-on Cursor rules | [`.cursor/rules/`](../.cursor/rules/) |

---

## Auth & security (non-negotiable summary)

1. **`getUser()`** for API auth gates — not `getSession()` (except session hydration after `getUser`).
2. **Trust tier is server-only** — [`web/lib/auth/trust-tier-admin.ts`](../web/lib/auth/trust-tier-admin.ts); DB trigger blocks user JWT writes.
3. **Profile owner writes** — [`profile-write-schema.ts`](../web/lib/auth/profile-write-schema.ts); never accept `is_admin`, `is_active`, `trust_tier*`.
4. **Admin mutations** — `requireAdminOr401(request)` + CSRF.
5. **Logout** — POST `/api/auth/logout` or POST `/api/auth/clear-session` with CSRF; GET returns 405.
6. **Schema changes** — Supabase MCP (`project-0-Choices-supabase`) + repo migration file + `get_advisors(security)`.
7. **Deploy** — git push → `main` → CI → Vercel; do not MCP-deploy production.

Full detail: [`AUTH_SECURITY_HANDOFF.md`](AUTH_SECURITY_HANDOFF.md).

---

## Verification before “done”

```bash
cd web && npm run types:ci
cd web && npm run test -- tests/unit/lib/auth/
rg "getSession\(\)" web/app/api --glob '*.ts'
npm run verify:docs   # from repo root
```

---

_Last updated: 2026-06-25_
