# Civics Platform Overview (Quick Reference)

_Last updated: November 12, 2025_

Use this guide to orient yourself before diving into the detailed civics documentation archived under `docs/archive/reference/civics/`.

## Key Concepts

- **Data sources**: OpenStates ingests (legislators, offices, districts), Google Civic Information API for address-to-district lookup, internal enrichment for contact details and aliases.
- **Primary services**:
  - `services/civics-backend/` — Node workers for ingest, enrichment, and verification.
  - `web/app/api/v1/civics/*` — Supabase-backed API routes serving representatives, districts, and coverage dashboards.
  - `web/lib/services/representative-service.ts` — Frontend fetch layer that hydrates stores/components.
- **Stores & UI**:
  - `representativeStore` + `electionStore` drive the UI surfaces in `web/features/civics/`.
  - Harness coverage lives at `/app/(app)/e2e/voting-store`, `/app/(app)/e2e/feeds-store`, and `/app/(app)/e2e/user-store` for end-to-end validation.
- **Testing hooks**: MSW fixtures and Playwright specs under `web/tests/unit/features/civics/` and `web/tests/e2e/specs/` ensure civic flows stay deterministic.

## Where to Read More

| Topic | Archived Reference |
| --- | --- |
| Full ingest & ops runbook | `docs/archive/reference/civics/civics-backend-operations.md` |
| Quickstart & environment prep | `docs/archive/reference/civics/civics-backend-quickstart.md` |
| Supabase schema & migrations | `docs/archive/reference/civics/civics-ingest-sql-migration.md` |
| Ingest checklists & rollout plan | `docs/archive/reference/civics/civics-ingest-checklist.md`, `docs/archive/reference/civics/civics-ingest-supabase-plan.md` |

## Fast Checks

- Confirm `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_CIVIC_API_KEY` are configured (see `ENVIRONMENT_VARIABLES.md`).
  - Address resolution uses a server proxy: `POST /api/v1/civics/address-lookup`
  - Proxy enforces per-IP rate limiting and caches responses briefly
  - Client code must not call Google APIs directly; use the proxy
- Run `npm run test:e2e -- --grep civics` after changing API routes or stores.
- For data refreshes, execute the scripts in `services/civics-backend/src/scripts/state/` following the archive runbook.

Keep this summary updated whenever the civics stack changes materially.
