# Browser Location Capture & Civic Data Roadmap

_Last updated: 2025-09-27_

## 0. Current Branch
- Branch: `feature/browser-location-capture`
- Flags: `BROWSER_LOCATION_CAPTURE`, `CIVICS_ADDRESS_LOOKUP`

## 1. Recon & Impact Audit
- [x] Inventory files touching location capture (frontend, API, resolver, schema).
- [x] Map ingest pipeline outputs → current DB tables vs future OCD backbone.
- [x] Document privacy/consent guardrails to preserve (peppered hashes, trust tiers, revocation flow).
- [ ] Log findings here with file references.

## 2. Schema & Types
- [ ] Author migrations for:
  - `civic_jurisdictions`
  - `jurisdiction_aliases`
  - `jurisdiction_geometries`
  - `jurisdiction_tiles`
  - `candidate_jurisdictions`
  - `user_location_resolutions`
  - `location_consent_audit`
- [ ] Update Supabase-generated types and Zod schemas.
- [ ] Plan data backfill script (`scripts/etl/generate-jurisdictions.ts`).

## 3. Resolver & API Layer
- [ ] Refactor `lib/privacy/location-resolver.ts` to call new resolver utility.
- [ ] Implement server-side resolver chain (Census → Nominatim → Google Civic) with caching.
- [ ] Rewrite `/api/v1/civics/address-lookup` to use canonical OCD backbone, respect consent, and persist to new tables.
- [ ] Harden API with rate limits, auth checks, and logging (no raw data).

## 4. Frontend & UX
- [ ] Update onboarding `LocationInput` to handle new resolver states.
- [ ] Wire onboarding flow to block progression until `user_location_resolutions` save succeeds.
- [ ] Add profile settings controls for re-run/delete (consent-aware).
- [ ] Surface trust-tier toggle in visualization UI; ensure opt-outs respected.

## 5. Downstream Consumption & Visualization
- [ ] Modify `lib/civics/geographic-service.ts` and `lib/electoral/geographic-feed.ts` to consume `civic_jurisdictions`.
- [ ] Build Supabase materialized views / cron job to generate heatmap H3 buckets and heuristic rollups.
- [ ] Provide API endpoints / hooks delivering aggregated data only.
- [ ] Draft UX spec for heatmap/choropleth/time-series toggles with tooltips + accessibility notes.

## 6. Telemetry, Testing, & Security
- [ ] Add resolver analytics (source, cache hit, fallback) without logging addresses.
- [ ] Extend tests: unit (resolver quantization), integration (API, consent revocation), e2e (geolocation happy/denied).
- [ ] Verify revocation clears precise data but leaves audit log.
- [ ] Review trust-tier gating logic + ensure bots can be isolated analytically.

## 7. Launch Checklist
- [ ] Manual QA script (permission flows, consent toggles, visualization filters).
- [ ] Confirm feature flags default off.
- [ ] Prepare back-out steps (drop new tables, rollback migrations) if needed.
- [ ] Update documentation (PRD, READMEs) with final architecture.

## Notes & Decisions Log
- _Use this section to capture deviations, trade-offs, or TODOs discovered mid-flight._
