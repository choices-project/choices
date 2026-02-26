# Deployment Guide

_Last updated: November 12, 2025_

## Purpose
Use this guide as the single source of truth for shipping the Choices web application. It covers the required checks, how to move a release from local verification to production, and where to look if something goes wrong.

---

## 1. Preflight Checklist

**Environment**
- Install Node.js 24.11+ and npm 11.6.1+ (enforced via `web/package.json` `packageManager` field and all CI/CD workflows).
- Install the Supabase CLI (`npm install -g supabase`) and authenticate against the target project.
- Create or update `web/.env.local` with the values listed in `ENVIRONMENT_VARIABLES.md`.
- Ensure production secrets (Supabase service role, Upstash Redis, Resend, Sentry, cron key) exist in your hosting provider before promoting the build.

**CI/CD Consistency**: All GitHub Actions workflows (`.github/workflows/*.yml`) and the Dockerfile enforce npm 11.6.1 to match the `packageManager` field. This ensures local development, CI, and production builds use identical tooling versions.

**Local verification (inside `web/`)**
```bash
npm install
npm run lint
npm run type-check
npm run test
npm run test:e2e
npm run build
```
- `npm run test:e2e` defaults to the mocked harness setup. Run `PLAYWRIGHT_USE_MOCKS=0 npm run test:e2e:staging` when validating against a staging backend.

**Database & types**
```bash
supabase db push                # Apply pending migrations
npm run types:generate          # Regenerate Supabase types after schema changes
npm run type-check              # Confirm type safety with regenerated types
```
- Review the generated diff in `supabase/migrations/` and confirm the schema is reflected in `DATABASE_SCHEMA.md` if changes are user-visible.

---

## 2. Staging Deployment

1. Run the `ci:verify:deploy` bundle locally to mirror CI gates:
   ```bash
   npm run ci:install
   npm run ci:verify:deploy     # audit:high, lint, type-check
   ```
2. Push the release branch to trigger the automated staging deployment or run your hosting provider's staging promotion (Vercel example: `vercel deploy --prebuilt`).
3. After staging is live:
   - Hit `/api/health` and `/api/health?service=civics`.
   - Run targeted E2E smoke tests against staging: `PLAYWRIGHT_USE_MOCKS=0 npm run test:e2e:staging`.
   - Verify core user flows (auth, onboarding, poll creation/voting, analytics dashboard) manually if time allows.

---

## 3. Production Deployment

1. Freeze the staging commit that passed the checks above.
2. Promote the build (Vercel example: `vercel deploy --prebuilt --prod`).
3. Monitor deployment logs for migration output and Supabase connectivity errors.
4. Rotate any feature flags needed for rollout using the admin dashboard or `featureFlagManager` helpers.

---

## 4. Post-Deployment Validation

- hit `/api/health` and confirm the `status` payload returns `"ok"` with all services green.
- Run production Playwright smoke tests (uses read-only service credentials):
  ```bash
  PLAYWRIGHT_USE_MOCKS=0 npm run test:e2e:production
  ```
- Spot-check analytics widgets to ensure Redis caching is warm and Supabase queries return data.
- Confirm Sentry, Resend, and Upstash dashboards show healthy traffic with no spikes.

---

## 5. Rollback & Runbooks

If you need to revert or disable a subsystem:
- Roll back the deployment in your hosting provider (Vercel → promote the previous build; container hosting → redeploy the prior image).
- Review the runbooks in `docs/archive/runbooks/`:
  - `operations/passkey-rollback-playbook.md` — Disable WebAuthn/passkey flows quickly.
  - `supabase-operations-guide.md` — Supabase management commands, credential rotation, and access policies.
- Restore the previous database state if a migration misbehaved. Use Supabase point-in-time recovery or your last backup.

---

## 6. Monitoring & Alerting

- **Sentry**: Verify new releases are tagged and review errors for regressions.
- **Upstash / Redis**: Watch rate-limit metrics and cache hit rates after deploy.
- **Supabase**: Check query logs for slow queries introduced by the release.
- **Status page / comms**: Post a release note or status update if the rollout affects user-visible behaviour.

---

## 7. Release Checklist (Governance & Rollout)
Use this list **before** calling a release done. Link back to the relevant evidence (Playwright runs, docs, issues).

- [ ] **Inclusive UI / A11y** — Automation (`npm run test:e2e -- --grep @axe`, navigation + analytics SR specs) green; manual NVDA/VoiceOver smoke logged in `scratch/gpt5-codex/archive/inclusive-platform/manual-a11y-smoke-*.md`.
- [ ] **Locale Coverage** — Locale-switch Playwright spec green; `npm run i18n:extract` snapshot committed; copy changes translated per `docs/technical/i18n-workflow.md`.
- [ ] **Contract & Harness Parity** — `npm run test:contracts` green; any new routes documented in `docs/TESTING/api-contract-plan.md`; MSW fixtures updated.
- [ ] **Documentation** — Architecture/API docs reflect new selectors, middleware, or response envelopes (`docs/STATE_MANAGEMENT.md`, `docs/API/contracts.md`, etc.).
- [ ] **Release Notes & Comms** — `docs/archive/release-notes/CHANGELOG.md` (or relevant release note) updated; support + partner teams notified of API schema or analytics changes.
- [ ] **Audit Scheduling** — Upcoming SR + locale audit owners/date confirmed in `scratch/gpt5-codex/archive/inclusive-platform/issues.md`.

Keep this document up to date as the deployment workflow evolves. When processes change, update both the commands above and any linked runbooks.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

