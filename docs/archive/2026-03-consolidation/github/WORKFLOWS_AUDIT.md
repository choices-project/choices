# GitHub Actions Workflows — Audit Summary

**Last audit:** 2026-02-02. Workflows are current and appropriate; the following updates were applied.

---

## Workflow Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI/CD Pipeline** (`ci.yml`) | push/PR → main, develop | Quality, lint, types, i18n; unit + contract + smoke + accessibility; Trivy + CodeQL upload; Docker build |
| **Comprehensive Testing** (`test.yml`) | push/PR → main, develop; manual | Unit/integration matrix, E2E, nav/accessibility, auth-production E2E, performance, security, load; test summary + PR comment |
| **Web CI (Secure)** (`web-ci.yml`) | push/PR (web/**); manual | Path-filtered: build, audit, Trivy, type/lint/locale, contracts, i18n snapshot, build |
| **types** (`types.yml`) | pull_request | TypeScript config check, types:strict, lint (non-blocking) |
| **Continuous Deployment** (`deploy.yml`) | push → main; manual | Pre-deploy validation, Vercel deploy, production checks |
| **Civics Smoke Test** (`civics-smoke-test.yml`) | PR (civics paths); manual | Civics-specific: build, Playwright + K6 smoke tests |
| **Civics Backend CI** (`civics-backend-ci.yml`) | PR/push (services/civics-backend/**) | Build + `ingest:check` for civics ingest pre-flight |
| **CodeQL** (`codeql-js.yml`) | push/PR → main; weekly schedule | JS/TS analysis, SARIF upload |
| **CodeQL Alert Summary** (`codeql-alert-summary.yml`) | PR open/sync | Summarizes CodeQL alerts on PR |
| **GitLeaks** (`gitleaks.yml`) | push/PR → main; weekly Mon | Secret scanning (requires `GITLEAKS_LICENSE`) |
| **Production Testing** (`production-tests.yml`) | push (paths), schedule */6h; manual | Production smoke/expanded tests against live URL |
| **Security Watch** (`security-watch.yml`) | daily + weekly Mon; manual | npm audit (high/critical), OSV scanner |
| **OpenStates Scheduled Sync** (`openstates-scheduled-sync.yml`) | 06:00 UTC daily; manual | Civics ingest: rate-limit-aware re-ingest (committees → activity). Secrets: `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `OPEN_STATES_API_KEY` (GitHub secret name — workflow maps to `OPENSTATES_API_KEY`) |

---

## Changes Applied

1. **ci.yml**
   - `actions/cache@v3` → `actions/cache@v4`
   - `aquasecurity/trivy-action@master` → `aquasecurity/trivy-action@0.24.0`
   - `codecov/codecov-action@v3` → `codecov/codecov-action@v4`

2. **types.yml**
   - Added `cache-dependency-path: web/package-lock.json` for correct npm cache.

3. **civics-smoke-test.yml**
   - K6 install: replaced deprecated `apt-key` with keyring-based repo setup.

4. **openstates-scheduled-sync.yml**
   - Runs `reingest:scheduled` (rate-limit-aware) via shell script when built. Env: `SUPABASE_URL` (from `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `OPENSTATES_API_KEY` (from secret `OPEN_STATES_API_KEY`).
   - **Secret name:** GitHub secret must be `OPEN_STATES_API_KEY` (underscore) — workflow maps it to `OPENSTATES_API_KEY`.

---

## Consistency Notes

- **Node:** Most workflows use `24.11.0` or `24.x`; both are fine.
- **Actions:** checkout@v4, setup-node@v4, upload-artifact@v4, download-artifact@v4 used consistently.
- **Trivy:** Pinned to `0.24.0` (no `@master`).
- **Cache:** cache@v4 with appropriate `cache-dependency-path` where needed.

No redundant workflows; CI vs test.yml have distinct roles (CI = gate + Docker, test = full matrix + production E2E).
