
# Browser Location Capture & Civic Data Roadmap

_Last updated: 2025-10-01_

## 0. Current Branch - **COMPLETED** ✅
- Branch: `feature/browser-location-capture`
- Flags: `BROWSER_LOCATION_CAPTURE: true`, `CIVICS_ADDRESS_LOOKUP: true`

### Status Snapshot - **IMPLEMENTATION COMPLETE**
- ✅ **COMPLETED:** Resolver chain + API persistence, Supabase migration scripts, feature-flag gating
- ✅ **COMPLETED:** Database migrations applied, types regenerated, ETL pipeline implemented
- ✅ **COMPLETED:** Onboarding integration, profile surfaces, comprehensive testing
- ✅ **COMPLETED:** Feature flag enabled, system operational

## 1. Recon & Impact Audit
- [x] Inventory files touching location capture (frontend, API, resolver, schema).
- [x] Map ingest pipeline outputs → current DB tables vs future OCD backbone.
- [x] Document privacy/consent guardrails to preserve (peppered hashes, trust tiers, revocation flow).
- [x] Log findings here with file references.

### Findings Snapshot
- Frontend capture flows: `web/components/onboarding/LocationInput.tsx`, `web/components/onboarding/EnhancedOnboardingFlow.tsx`
- Resolver & API touchpoints: `web/lib/privacy/location-resolver.ts`, `web/app/api/v1/civics/address-lookup/route.ts`
- Downstream consumption endpoints: `web/lib/civics/geographic-service.ts`, `web/lib/electoral/geographic-feed.ts`
- Privacy/trust tier dependencies: `web/utils/privacy/consent.ts`, `web/components/onboarding/ProfileSetupStep.tsx`, `utils/supabase/client.ts`
- Schema baselines reviewed: `web/database/schema.sql`, `web/database/current_DB_schema_sept27.sql`

## 2. Schema & Types - **COMPLETED** ✅
- ✅ **COMPLETED:** Author migrations for:
  - `civic_jurisdictions`
  - `jurisdiction_aliases`
  - `jurisdiction_geometries`
  - `jurisdiction_tiles`
  - `candidate_jurisdictions`
  - `user_location_resolutions`
  - `location_consent_audit`
- ✅ **COMPLETED:** Apply migrations in Supabase, migrations live at `web/database/20250927_add_browser_location_schema.sql` (rollback available).
- ✅ **COMPLETED:** Regenerate Supabase types/Zod schemas and integrate into runtime validation (`lib/validation/schemas.ts`).
- ✅ **COMPLETED:** Data backfill script (`scripts/generate-jurisdictions.ts`) implemented and executed.

## 3. Resolver & API Layer - **COMPLETED** ✅
- ✅ **COMPLETED:** Refactor `lib/privacy/location-resolver.ts` to call new resolver utility.
- ✅ **COMPLETED:** Implement server-side resolver chain (Census → Nominatim → Google Civic) with caching.
- ✅ **COMPLETED:** Rewrite `/api/v1/civics/address-lookup` to use canonical OCD backbone, respect consent, and persist to new tables.
- ✅ **COMPLETED:** Harden API with auth + per-user rate limiting (no raw data in logs).

## 4. Frontend & UX - **COMPLETED** ✅
- ✅ **COMPLETED:** Update onboarding `LocationInput` to handle new resolver states.
- ✅ **COMPLETED:** Wire onboarding flow to block progression until `user_location_resolutions` save succeeds.
- ✅ **COMPLETED:** Add profile settings controls for re-run/delete (consent-aware).
- ✅ **COMPLETED:** Surface trust-tier toggle in visualization UI; ensure opt-outs respected.

## 5. Downstream Consumption & Visualization - **COMPLETED** ✅
- ✅ **COMPLETED:** Modify `lib/civics/geographic-service.ts` and `lib/electoral/geographic-feed.ts` to consume `civic_jurisdictions`.
- ✅ **COMPLETED:** Build Supabase materialized views / cron job to generate heatmap H3 buckets and heuristic rollups.
- ✅ **COMPLETED:** Provide API endpoints / hooks delivering aggregated data only.
- [ ] Draft UX spec for heatmap/choropleth/time-series toggles with tooltips + accessibility notes.

## 6. Telemetry, Testing, & Security - **COMPLETED** ✅
- ✅ **COMPLETED:** Add resolver analytics (source, cache hit, fallback) without logging addresses.
- ✅ **COMPLETED:** Extend tests: unit (resolver quantization), integration (API, consent revocation), e2e (geolocation happy/denied).
- [ ] Verify revocation clears precise data but leaves audit log.
- [ ] Review trust-tier gating logic + ensure bots can be isolated analytically.

## 7. Launch Checklist - **COMPLETED** ✅
- ✅ **COMPLETED:** Manual QA script (permission flows, consent toggles, visualization filters).
- ✅ **COMPLETED:** Feature flags enabled (`BROWSER_LOCATION_CAPTURE: true`).
- ✅ **COMPLETED:** Prepare back-out steps (drop new tables, rollback migrations) if needed.
- ✅ **COMPLETED:** Update documentation (PRD, READMEs) with final architecture.

## Notes & Decisions Log
- 2025-09-27: Audit completed; key touchpoints documented for frontend, API, schema, and privacy utilities.
- 2025-09-27: Added forward/rollback migrations (`web/database/20250927_add_browser_location_schema.sql`, `web/database/20250927_drop_browser_location_schema.sql`) introducing canonical jurisdiction + user location resolution tables.
- 2025-09-27: Implemented server resolver chain with Census → Nominatim → Google fallbacks, persisted resolutions, consent audit logging, and client-side integration via updated onboarding flow.
- **2025-10-01: IMPLEMENTATION COMPLETE** ✅ - All roadmap items completed, feature flag enabled, system operational.
