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
| **CodeQL** (`codeql-js.yml`) | push/PR → main; weekly schedule | JS/TS analysis, SARIF upload |
| **CodeQL Alert Summary** (`codeql-alert-summary.yml`) | PR open/sync | Summarizes CodeQL alerts on PR |
| **GitLeaks** (`gitleaks.yml`) | push/PR → main; weekly Mon | Secret scanning (requires `GITLEAKS_LICENSE`) |
| **Production Testing** (`production-tests.yml`) | push (paths), schedule */6h; manual | Production smoke/expanded tests against live URL |
| **Security Watch** (`security-watch.yml`) | daily + weekly Mon; manual | npm audit (high/critical), OSV scanner |
| **OpenStates Scheduled Sync** (`openstates-scheduled-sync.yml`) | 06:00 UTC daily; manual | Civics ingest: committees → activity → events (resume). Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPEN_STATES_API_KEY` |

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
   - Uses `NEXT_PUBLIC_SUPABASE_URL` and `OPEN_STATES_API_KEY` to match repo secrets (no `SUPABASE_URL`).

---

## Consistency Notes

- **Node:** Most workflows use `24.11.0` or `24.x`; both are fine.
- **Actions:** checkout@v4, setup-node@v4, upload-artifact@v4, download-artifact@v4 used consistently.
- **Trivy:** Pinned to `0.24.0` (no `@master`).
- **Cache:** cache@v4 with appropriate `cache-dependency-path` where needed.

No redundant workflows; CI vs test.yml have distinct roles (CI = gate + Docker, test = full matrix + production E2E).
