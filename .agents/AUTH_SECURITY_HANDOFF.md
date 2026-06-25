# Auth & security — agent handoff (canonical)

_Last updated: 2026-06-25_

**Read this before auth, profile, admin, RLS, or migration work.** Detailed backlog and MCP audit items: [`scratch/AUTH_OVERHAUL_PLAN.md`](../scratch/AUTH_OVERHAUL_PLAN.md). Setup (MCP, skills, deploy): [`docs/AGENT_SETUP.md`](../docs/AGENT_SETUP.md).

---

## 1. Architecture (minimal core)

| Layer | Mechanism |
|-------|-----------|
| Session | httpOnly Supabase SSR cookies (`sb-*-auth-token`) |
| Browser client | Cannot read httpOnly cookies → **`POST /api/auth/session`** (CSRF) hydrates via `setSession` |
| Auth decisions (API) | **`supabase.auth.getUser()`** — never `getSession()` for gates |
| Admin | `user_profiles.is_admin` via server; **`requireAdminOr401(request?)`** |
| Privileged profile fields | API strip + **DB trigger** `user_profiles_privileged_columns_guard` |
| Trust tier | **Server-managed only** — see §3 |
| Deploy | **git push → `main` → CI → Vercel** — never MCP/plugin deploy to production |

**Product scope:** [`docs/MINIMAL_CORE.md`](../docs/MINIMAL_CORE.md). Full platform archived on `archive/full-platform`.

---

## 2. Non‑negotiable rules (implement every time)

### 2.1 Authorization

```bash
# Must return ONLY session/route after getUser (hydration bridge)
rg "getSession\(\)" web/app/api --glob '*.ts'
```

- Use [`web/lib/auth/require-api-user.ts`](../web/lib/auth/require-api-user.ts) or explicit `getUser()` on mutating routes.
- Never trust `user_metadata.role` or JWT claims for admin UI.

### 2.2 Profile writes (owner)

| Do | Don't |
|----|--------|
| [`profile-write-schema.ts`](../web/lib/auth/profile-write-schema.ts) + `stripPrivilegedProfileFields()` | Accept `is_admin`, `is_active`, `trust_tier*` from client |
| [`createOwnerProfilePayload()`](../web/lib/auth/safe-profile-response.ts) on owner API responses | Return privilege columns to the signed-in owner unnecessarily |
| `OWNER_PROFILE_SELECT_COLUMNS` on profile routes | Broad `SELECT *` on `user_profiles` for owners |

**Privileged / server-managed columns:** `is_admin`, `is_active`, `trust_tier`, `trust_tier_score`, `trust_tier_version`, `integrity_consent_*`, `user_id`, `id`, timestamps, dashboard analytics fields.

### 2.3 Trust tier (server-only)

**Users never set or change trust tier.** Tier changes follow **verified actions** (registration bootstrap, passkey, future RPCs)—not onboarding form posts or profile PATCH.

| Write path | How |
|------------|-----|
| Initial tier at signup | **`getSupabaseAdminClient()`** in register/login/sync-user |
| Passkey → T2 | [`promoteUserTrustTierAdmin()`](../web/lib/auth/trust-tier-admin.ts) |
| Future progression | Same helper or **`calculate_user_trust_tier`** RPC via **service role**—never user JWT `.update()` |

**DB enforcement (production applied):**

- Migration repo: `supabase/migrations/20260624120000_prevent_user_trust_tier_self_update.sql`
- Remote may show version `20260625000926` (MCP apply timestamp)—same function body.
- Trigger blocks `trust_tier*` + `is_admin` / `is_active` on INSERT/UPDATE for non–`service_role`.
- User JWT INSERT forces `trust_tier = 'T0'` until admin/service sets tier.

### 2.4 Admin + CSRF

```typescript
// Mutations — always pass request
const authGate = await requireAdminOr401(request);
if (authGate) return authGate;
```

- GET admin routes: `requireAdminOr401()` without request is OK.
- Exception: [`/api/admin/audit/revert`](../web/app/api/admin/audit/revert/route.ts) uses `x-admin-key` (server automation only).

### 2.5 State-changing routes

- CSRF: [`validateCsrfProtection`](../web/app/api/auth/_shared/csrf.ts) on POST/PUT/PATCH/DELETE for auth, profile, polls, admin (via `requireAdminOr401(request)`).
- Logout: **POST** [`/api/auth/logout`](../web/app/api/auth/logout/route.ts) + CSRF — GET clear-session returns **405**.

### 2.6 Database changes

1. **Prefer Supabase MCP** (`project-0-Choices-supabase`): `list_tables`, `execute_sql`, `apply_migration`, `get_advisors`.
2. Add SQL under `supabase/migrations/YYYYMMDDHHMMSS_name.sql` in repo **and** apply via MCP.
3. After DDL: `get_advisors { "type": "security" }`.
4. Regenerate types: `cd web && npm run types:generate` when schema changes.
5. Fallback: `DATABASE_URL` + `psql` — see AGENT_SETUP §2.1.

---

## 3. Key files (single source — do not duplicate logic)

| Concern | Path |
|---------|------|
| Auth context / logout | `web/contexts/AuthContext.tsx`, `web/lib/auth/client-logout.ts` |
| Login / register | `web/app/api/auth/login/route.ts`, `register/route.ts` |
| Session hydration | `web/app/api/auth/session/route.ts`, `web/lib/auth/browser-session.ts` |
| Profile API | `web/app/api/profile/route.ts` |
| Profile write schema | `web/lib/auth/profile-write-schema.ts` |
| Safe profile response | `web/lib/auth/safe-profile-response.ts` |
| Trust tier (admin writes) | `web/lib/auth/trust-tier-admin.ts` |
| Admin gate | `web/features/auth/lib/admin-auth.ts` |
| CSRF | `web/app/api/auth/_shared/csrf.ts` |
| Middleware (cookie presence) | `web/middleware.ts` |
| DB privilege trigger | `guard_user_profiles_privileged_columns()` |

---

## 4. Verification (run before claiming done)

```bash
cd web && npm run types:ci
cd web && npm run test -- tests/unit/lib/auth/
rg "getSession\(\)" web/app/api --glob '*.ts'   # expect: session/route.ts only
rg "trust_tier:" web/app/api/profile           # expect: no owner writes
```

**MCP smoke (when connected):**

| Tool | Check |
|------|--------|
| `list_migrations` | Includes `20260622120000`, trust-tier migration |
| `execute_sql` | Trigger `user_profiles_privileged_columns_guard` on INSERT+UPDATE |
| `get_advisors(security)` | Review new permissive RLS after your migration |

**Manual smoke:** login (no tokens in JSON) → `/polls` → logout → `/` ; PATCH profile with `is_admin` / `trust_tier` fails.

---

## 5. Completed work (2026-06-22 — 2026-06-25)

| Item | Status |
|------|--------|
| Profile privilege escalation (API + trigger) | ✅ |
| Trust tier server-only (trigger + admin helper + tests) | ✅ |
| Logout CSRF (POST only) | ✅ |
| Tokens removed from login/register JSON | ✅ |
| `getUser()` on auth-decision routes | ✅ |
| Admin mutation CSRF (incl. PWA push send) | ✅ |
| `/api/auth/me` drops `is_active` | ✅ |
| Auth unit tests (27 in `tests/unit/lib/auth/`) | ✅ |
| MCP + Vercel wired; docs in AGENT_SETUP §2.0 | ✅ |

---

## 6. Remaining backlog (priority order)

Work from [`scratch/AUTH_OVERHAUL_PLAN.md`](../scratch/AUTH_OVERHAUL_PLAN.md) §16 — do not skip P0:

| P | Item | Action |
|---|------|--------|
| **P0** | `get_dashboard_data` IDOR | RPC: enforce `auth.uid() = p_user_id`; revoke `anon` EXECUTE |
| **P0** | `polls` / `votes` `Authenticated full access` | Drop permissive ALL policies; keep creator-scoped writes |
| **P1** | `user_profiles` public SELECT | Owner-only + public projection view |
| **P1** | `feedback_insert` WITH CHECK true | Bind to `auth.uid()` |
| **P1** | Feedback admin RLS `id` vs `user_id` | Fix policy column |
| **P2** | Leaked password protection | Supabase Dashboard → Auth |
| **P2** | Middleware JWT | Cookie check only today; layout `getUser()` on new protected pages |
| **P3** | Session bridge tokens | Eliminate refresh token in JSON long-term |
| **P3** | Auth regression in CI | E2E escalation + logout |

---

## 7. Trust tier product semantics

Documented in [`docs/TRUST_LAYER.md`](../docs/TRUST_LAYER.md):

- **T0** — DB default for user-JWT inserts; minimal verification.
- **T1** — Server assigns at account creation (register/login admin insert).
- **T2** — Server promotes on passkey registration (WebAuthn verify route).
- **Higher tiers** — Only via future server rules / admin / RPC—not profile or onboarding APIs.

**Equal voting:** trust-tier RPCs are for **analytics/display** only—not default poll tallies ([`VOTING_INTEGRITY_POLICY`](../docs/archive/reference/VOTING_INTEGRITY_POLICY.md)).

---

## 8. Agent workflow checklist

1. Read this file + relevant section of scratch plan.
2. Inspect code (`rg`, read) — do not speculate.
3. Schema/RLS: Supabase MCP first.
4. Implement: API strip → admin/service writes → migration/trigger → tests.
5. `types:ci` + targeted tests.
6. Update scratch plan status + SECURITY/TRUST_LAYER if behavior changed.
7. Deploy: user pushes `main`; you do not MCP-deploy production.
