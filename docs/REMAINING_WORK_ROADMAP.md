# Remaining work (consolidated roadmap)

_Last updated: May 16, 2026_

This is the **single prioritized backlog** for the Choices monorepo (primarily `web/` + `supabase/` + CI). It merges open items from [`ROADMAP.md`](./ROADMAP.md), [`DOCUMENTATION_AUDIT_ROADMAP.md`](./DOCUMENTATION_AUDIT_ROADMAP.md), [`TESTING.md`](./TESTING.md), [`STATE_MANAGEMENT.md`](./STATE_MANAGEMENT.md), and recent engineering triage—without duplicating full execution checklists already spelled out in the doc-audit file.

**How to use**

| Need | Read |
|------|------|
| **Pick next task** | This file (sections below, ordered P0 → P3). |
| Launch checklists, engagement phases, completed history | [`ROADMAP.md`](./ROADMAP.md). |
| Doc ↔ code audit steps, SSOT tables, agent/MCP checklists | [`DOCUMENTATION_AUDIT_ROADMAP.md`](./DOCUMENTATION_AUDIT_ROADMAP.md). |
| Commands, E2E harness, CI job map | [`TESTING.md`](./TESTING.md), [`AGENTS.md`](../AGENTS.md). |

**Governance:** `scripts/check-governance.js` still expects store/API changes to touch [`ROADMAP.md`](./ROADMAP.md) and [`STATE_MANAGEMENT.md`](./STATE_MANAGEMENT.md) where applicable. When you close an item **here**, update or check off the matching section in `ROADMAP.md` so the two stay aligned.

---

## P0 — Launch, production safety, and blocking verification

| ID | Item | Source / notes |
|----|------|----------------|
| P0-1 | **DMARC DNS** for production mail domain | `ROADMAP.md` §1.1 — Resend path in code; DNS still operator-owned. |
| P0-2 | **OAuth providers** (Google/GitHub) in Supabase + redirect URLs + `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS` on Vercel | `ROADMAP.md` §1.1 |
| P0-3 | **Passkeys prod env** — `RP_ID`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_ENABLE_PASSKEYS=1` | `ROADMAP.md` §1.1 |
| P0-4 | **VAPID keys** — `WEB_PUSH_VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` in production | `ROADMAP.md` §1.1 |
| P0-5 | **Remove test fixtures** from prod DB (e.g. “test test” site message, E2E polls) | `ROADMAP.md` §1.1 |
| P0-6 | **Manual production verification** — password reset; OAuth; passkeys on device; full onboarding; profile save; contact admin flows; push subscribe + delivery; reps + poll analytics; admin; **rate-limit runbook** (429 on abuse) | `ROADMAP.md` §1.2 |
| P0-7 | **Production E2E (`npm run test:e2e:production`)** — needs `E2E_*` secrets; close auth/session regressions on live (`/auth` lockout, session continuity). Evidence: two consecutive green runs per release policy in `TESTING.md` / `ROADMAP.md` §1.3 | `ROADMAP.md` §1.3 |
| P0-8 | **Post-deploy smoke** — `deploy.yml` `workflow_dispatch` path; keep parity with live smoke expectations | `ROADMAP.md` §1.3 |
| **P0-9** | **Post-auth redirect correctness (all sign-in methods)** — **Active (May 2026).** Consolidated May 16: **OAuth** → server `GET /auth/callback/route.ts` only (removed client callback page + redundant `sync-session` hop); **password / passkey / register** → API routes set httpOnly cookies, then `navigateAfterAuth()` (`web/lib/auth/post-auth-navigation.ts`); **`/api/auth/sync-session`** retained as fallback only. See `web/lib/auth/README.md`. **Operator checks:** Supabase Site URL + redirect URLs include `https://www.choices-app.com/auth/callback`. **Done when:** production manual matrix green (password, OAuth, passkey, reset) + auth unit tests pass. | Engineering triage + production UX |

---

## P1 — Reliability, quality ceiling, and CI depth

### Premiere-quality program (release engineering)

| ID | Item | Source / notes |
|----|------|----------------|
| P1-Q1 | **Workflow parity evidence** — document two consecutive green runs covering `verify:docs`, `lint:strict`, `types:ci`, `jest:ci` (or CI unit job), `./scripts/vercel-build.sh`, `test:e2e:smoke`, `test:e2e:critical`, `test:e2e:axe` across `ci.yml`, `web-ci.yml`, `test.yml`, `types.yml` | `ROADMAP.md` premiere § + `DOCUMENTATION_AUDIT_ROADMAP.md` § premiere-quality |
| P1-Q2 | **Flake governance** — SLA (24h classify / 48h owner); quarantine requires owner + issue + expiry + promotion criteria | `TESTING.md`, `DOCUMENTATION_AUDIT_ROADMAP.md` |
| P1-Q3 | **Risk-weighted coverage** — auth/admin/session boundaries; security-sensitive APIs; expand contracts when routes change | `ROADMAP.md` premiere Phase 2 |
| P1-Q4 | **`@performance` + security regression** jobs — ensure CI projects/names stay aligned when adding suites | `TESTING.md` CI section |

### Testing debt (classify fix vs quarantine)

| ID | Item | Source / notes |
|----|------|----------------|
| P1-T1 | **Jest clusters** — `tests/integration/feeds/`, `tests/unit/supabase/` called out as legacy debt in `AGENTS.md` / `TESTING.md`; triage each failure vs quarantine policy | `AGENTS.md`, `TESTING.md` |
| P1-T2 | **Jest worker teardown** — “worker process has failed to exit gracefully” / open handles; run `npx jest --detectOpenHandles` per project, fix timers/subscriptions, reduce reliance on `forceExit` in `jest.config.cjs` | Engineering triage (May 2026 quality pass) |
| P1-T3 | **Full Playwright + Axe jobs** — `DOCUMENTATION_AUDIT_ROADMAP.md` deploy log notes failures (a11y-critical specs, `fetch failed` from dev server); reproduce with narrowed specs, fix root cause vs env | `DOCUMENTATION_AUDIT_ROADMAP.md` § deploy log |
| P1-T4 | **E2E manual gap** — `/polls/create?representative_id=...` from civics | `ROADMAP.md` §2.1 table |
| P1-T5 | **Store harness** — `voterRegistrationStore`: add harness when CTA analytics work starts | `STATE_MANAGEMENT.md` |
| P1-T6 | **Post-auth redirect E2E** — extend `tests/e2e/specs/auth/auth-redirects.spec.ts` (or production curated auth) for `redirectTo` on password, OAuth, and passkey when not in harness mode; complements **P0-9** | P0-9 follow-up |

### Accessibility & performance (post-MVP bar)

| ID | Item | Source / notes |
|----|------|----------------|
| P1-A1 | **Screen reader QA** — NVDA / JAWS / VoiceOver on key flows per [`SCREEN_READER_TESTING.md`](./SCREEN_READER_TESTING.md) | `ROADMAP.md` §2.2 |
| P1-P1 | **Core Web Vitals** — LCP / CLS / INP targets; `npm run lighthouse:cwv` per [`PERFORMANCE.md`](./PERFORMANCE.md) | `ROADMAP.md` §2.3 |

### Documentation & agent ergonomics (rolling)

| ID | Item | Source / notes |
|----|------|----------------|
| P1-D1 | **Env drift** — migrate high-value `process.env` reads into `web/lib/config/env.ts`; document build-time exceptions in `ENVIRONMENT_VARIABLES.md` | `DOCUMENTATION_AUDIT_ROADMAP.md` §2 / §3.8 |
| P1-D2 | **Agent onboarding** — align `docs/AGENT_SETUP.md` Node version language with `AGENTS.md` / Volta pin (24.x) | Doc drift triage |
| P1-D3 | **Quarterly** — MCP paths, skills, `.cursor/mcp.json` machine-path check | `DOCUMENTATION_AUDIT_ROADMAP.md` §11 |

---

## P2 — Product elevation and platform polish

| ID | Item | Source / notes |
|----|------|----------------|
| P2-1 | **Activity feed** — rep/poll/district social-style signals | `ROADMAP.md` §3.3 |
| P2-2 | **Push scenarios** — poll closing soon, rep responses, followed topics | `ROADMAP.md` §3.3 |
| P2-3 | **Command palette** — expand Cmd+K with suggestions + recents | `ROADMAP.md` §5 |
| P2-4 | **Device flow** — Supabase OAuth config + full E2E beyond contract tests | `ROADMAP.md` §5 |
| P2-5 | **Social sharing** — civics / visual / OG pipelines (flags exist; on hold) | `ROADMAP.md` §5 + quarantined flags |
| P2-6 | **Civics ingest ops** — metrics/logging for long-running scripts (stretch); ingest detail in `services/civics-backend/NEW_civics_ingest/docs/` | Archive / `docs/archive/2026-03-consolidation/ROADMAP_SINGLE_SOURCE.md` |
| P2-7 | **Optional DB doc depth** — per-table RLS appendix in docs if compliance asks | `DOCUMENTATION_AUDIT_ROADMAP.md` P2 stretch |

---

## P3 — Future / unscoped (needs product spec)

| Feature | Notes |
|---------|--------|
| Supabase Realtime for live vote counts | Not wired |
| Poll comment threads + moderation | Spec + UI |
| User reputation | Spec + algorithm |
| Personalized recommendations | Spec + pipeline |
| Automated poll generation | Flag only; needs implementation spec |
| Advanced privacy (ZK/DP) | Research |
| Social signup (OAuth) | Quarantined flag `SOCIAL_SIGNUP` |

**Quarantined flags** (do not ship work unless product unquarantines): `AUTOMATED_POLLS`, `SOCIAL_SHARING_CIVICS`, `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG`, `CIVICS_TESTING_STRATEGY`, `ADVANCED_PRIVACY`, `SOCIAL_SIGNUP` — see `ROADMAP.md` §5 and `web/lib/core/feature-flags.ts`.

---

## Quick command reference

```bash
# Repo root
npm run verify:docs
npm run governance:check

# web/
npm run lint:strict && npm run types:ci
npm run test
npm run test:contracts
npm run test:e2e:smoke
npm run test:e2e:critical
npm run test:e2e:axe

# Post-auth redirect unit tests
npm run test -- tests/unit/lib/auth/normalize-post-auth-redirect.test.ts tests/unit/lib/auth/resolve-post-auth-redirect.test.ts
```

---

## Archive-only references (historical; do not treat as current gates)

- [`docs/archive/2026-03-consolidation/PRODUCTION_TESTING_STATUS.md`](./archive/2026-03-consolidation/PRODUCTION_TESTING_STATUS.md) — older production E2E tallies; prefer live CI + `ROADMAP.md` §1.3 for current expectations.

**Owner:** Core maintainers  
**Cadence:** Update this file when closing or adding P0/P1 items; review monthly at minimum.
