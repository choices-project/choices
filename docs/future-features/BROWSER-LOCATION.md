# Browser Location Capture & Storage PRD

**Created:** March 14, 2025  
**Status:** 🧭 Draft  
**Feature Flag:** `BROWSER_LOCATION_CAPTURE: false`  
**Owner:** Civics Foundation Team

---

## 🎯 Context
- `components/onboarding/LocationInput.tsx:52` already requests `navigator.geolocation` but ships mocked juristiction responses (`components/onboarding/LocationInput.tsx:105`), so no real coordinates ever leave the component.
- On-device resolution utilities exist but currently return placeholder data (`lib/privacy/location-resolver.ts:30`, `lib/privacy/location-resolver.ts:121`) and never write back to user state.
- User profiles only persist a free-form `location` string and a `show_location` toggle (`shared/core/database/supabase-schema.sql:23`, `shared/core/database/supabase-schema.sql:34`), leaving no columns for durable latitude/longitude or precision metadata.
- Profile APIs update generic fields but ignore any geo payloads (`app/api/profile/update/route.ts:43`) and the reader endpoint omits location columns entirely (`app/api/user/profile/route.ts:60`).
- Typed Supabase clients expose `user_profiles` without geo fields (`utils/supabase/client.ts:8`), increasing risk of silent drift after schema changes.
- Civic UI surfaces expect a user location string to personalize content (`components/civics/CivicsLure.tsx:17`, `components/civics/CivicsLure.tsx:80`) while downstream services already resolve officials by coordinates (`lib/civics/geographic-service.ts:243`, `lib/electoral/geographic-feed.ts:78`).

---

## ✅ Goals
- Capture high-accuracy browser geolocation (with graceful degradation) and persist lat/long with coarse precision metadata.
- Respect privacy-first positioning by gating collection behind explicit consent, honoring opt-outs, and storing only what downstream civic services require.
- Deliver a consumable location bundle to electoral and civic feeds so existing personalization no longer depends on mock data.

## 🚫 Non-Goals
- Building full real-time location tracking or background updates; this is a one-time (or user-triggered) capture.
- Replacing the current manual ZIP/address entry flows; they remain as fallbacks.
- Shipping production-grade reverse geocoding services—initial release can leverage trusted third-party APIs already planned in `lib/privacy/location-resolver`.

---

## 👥 User Stories
- As a first-time voter onboarding on mobile, I want to tap "Use my current location" and immediately see local races without typing an address.
- As a privacy-conscious user, I want to understand what is stored, adjust visibility, or delete my location from profile settings at any time.
- As a civic data consumer (e.g., electoral feed), I want reliable lat/long to map users to OCD divisions so I can surface relevant officials.

---

## 📐 Functional Requirements
### Acquisition & UX
- Replace mocked coordinate handling with real pipeline: `LocationInput` must convert permission grants into stored coordinates while retaining manual entry fallback (`components/onboarding/LocationInput.tsx:52`, `components/onboarding/LocationInput.tsx:105`).
- Enhanced onboarding should persist step completion only after a location payload (manual or geo) is saved, leveraging existing step orchestration (`components/onboarding/EnhancedOnboardingFlow.tsx:162`).

### Persistence & API
- Extend `user_profiles` with `geo_lat`, `geo_lon`, `geo_precision`, and `geo_updated_at` columns alongside the existing string location (`shared/core/database/supabase-schema.sql:23`).
- Update the profile write path to sanitize, quantize, and store the new fields plus a derived friendly label (`app/api/profile/update/route.ts:43`).
- Ensure the profile read endpoint and client types surface the new geo fields for authenticated pages (`app/api/user/profile/route.ts:60`, `utils/supabase/client.ts:8`).
- Add profile settings UI affordances for viewing/removing stored coordinates within the existing account card layout (`app/(app)/profile/page.tsx:255`, `app/(app)/profile/edit/page.tsx:283`).
- Introduce canonical jurisdiction storage via new `civic_jurisdictions` (OCD keyed) and `jurisdiction_aliases` tables so manual entry, browser capture, and ingest share a single backbone.
- Persist resolver results to `user_location_resolutions` plus a `location_consent_audit` trail, storing quantized coords, consent version, and coarse hashes for future deletions.

### Downstream Consumption
- Provide a normalized location object `{ lat, lon, source, precision }` to civic feature hooks so components like `CivicsLure` stop mocking data (`components/civics/CivicsLure.tsx:17`).
- Update geographic services to accept persisted coordinates before falling back to ZIP (`lib/civics/geographic-service.ts:243`) and reuse them when generating feeds (`lib/electoral/geographic-feed.ts:78`).

---

## 🔒 Privacy & Security Requirements
- Gate geolocation behind explicit consent that maps to the existing `demographics` scope (`utils/privacy/consent.ts:10`) and record the decision with timestamp/versioning.
- Store a coarse-grained hash (e.g., H3 cell) for analytics aggregation using existing region bucket helpers (`utils/privacy/data-management.ts:314`) while purging precise coordinates if consent is revoked.
- Surface clear copy in the onboarding privacy block to explain retention and deletion workflows (`components/onboarding/LocationInput.tsx:138`).
- Ensure data retention policies align with `show_location` privacy settings (`shared/core/database/supabase-schema.sql:34`).

---

## 🛠️ Technical Approach
### Frontend
- Refactor the geolocation branch to call a shared resolver that returns `{ lat, lon, accuracy }`, handle permission errors, and pass results through onboarding state (`components/onboarding/LocationInput.tsx:52`).
- Wire onboarding context to stage location payloads, retry submission on transient failures, and block progression until persistence succeeds (`components/onboarding/EnhancedOnboardingFlow.tsx:162`).
- Introduce profile settings controls to re-run geolocation, display last-updated timestamps, or delete stored data in the account cards (`app/(app)/profile/page.tsx:281`).

### Backend & Data
- Author a Supabase migration adding numeric latitude/longitude with appropriate constraints and triggers to normalize precision (`shared/core/database/supabase-schema.sql:23`).
- Expand request validation to strip high-precision data server-side, enforce trust-tier rules, and respect consent flags before storing (`app/api/profile/update/route.ts:43`).
- Return sanitized location payloads (no raw geohash) from profile APIs and update typed clients plus Zod schemas accordingly (`app/api/user/profile/route.ts:60`, `lib/validation/schemas.ts:34`).

### Services & Integrations
- Update `lib/privacy/location-resolver` to support real providers and return `{ ocdDivisionId, lat, lon, accuracy, source }` bundles (`lib/privacy/location-resolver.ts:30`).
- Cache jurisdiction lookups keyed by coarse grid cells and reuse existing candidate/election queries with stored coordinates (`lib/civics/geographic-service.ts:243`).
- Feed the coordinates into the electoral orchestrator so `generateElectoralFeed` becomes deterministic (`lib/electoral/geographic-feed.ts:78`).
- Load free boundary datasets (US Census TIGER/Line, Open Civic Data polygons, OpenStates districts) into Supabase tables (`jurisdiction_geometries`, `jurisdiction_tiles`) so every lat/lon maps to the same OCD foreign key the ingest pipeline uses.
- Call external providers in a privacy-first order—Census Geocoder → OpenStreetMap Nominatim → Google Civic—only falling back when the prior source misses, and persist normalized responses through the consent gate.
- Extend `CanonicalIdService` so new jurisdictions are registered alongside candidates, keeping crosswalks authoritative without exposing raw address data.
- Ensure user-facing clients fetch civic information exclusively from Supabase; browsers never contact third-party civics APIs directly.

---

## 📊 Telemetry & Observability
- Emit client analytics events for permission outcomes (granted, denied, blocked) and persistence success/failure using the existing performance hooks (`lib/performance/performance-metrics.ts:183`).
- Add server logs capturing geo consent decisions and normalization results with non-PII metadata (`app/api/profile/update/route.ts:69`).
- Monitor Supabase row counts for profiles with geo data to validate adoption.

---

## 🧪 Testing Strategy
- Unit-test the resolver abstraction to ensure coordinate quantization and consent gating behave as expected (`lib/privacy/location-resolver.ts:30`).
- Add component tests covering happy path, permission denied, and manual fallback flows in `LocationInput` (`components/onboarding/LocationInput.tsx:52`).
- Extend profile API integration tests to confirm geo fields read/write correctly and respect consent toggles (`app/api/profile/update/route.ts:43`).
- Update Playwright smoke tests to simulate granting browser geolocation and assert personalized civic content renders (`components/civics/CivicsLure.tsx:80`).

---

## ⚠️ Risks & Mitigations
- **Permission fatigue:** Browsers may deny prompts; keep manual entry path and store denials to avoid re-prompt loops (`components/onboarding/LocationInput.tsx:73`).
- **Precision leakage:** Quantize coordinates server-side and maintain only coarse hashes for analytics (`utils/privacy/data-management.ts:334`).
- **Schema drift:** Update generated Supabase types and Zod schemas in lockstep with migrations (`utils/supabase/client.ts:8`, `lib/validation/schemas.ts:34`).
- **Third-party dependency limits:** Cache civic lookups and design retries/backoff for Google Civic quota errors (`lib/privacy/location-resolver.ts:55`).

---

## ❓ Open Questions
- What precision level (e.g., 3–4 decimal places) balances personalization with privacy expectations?
- Do we need a separate consent scope for precise coordinates vs. coarse ZIP-level data?
- Should background refresh be offered (e.g., prompt every election cycle) or left manual?
- How will we surface location removal/audit history to comply with future governance requirements?

---

## 📈 Success Metrics
- ≥60% of onboarding users grant location access and persist a coordinate bundle within the first 30 days.
- Civic feed engagement (CTR to local races) increases by ≥15% for users with stored coordinates vs. control.
- <1% of location persistence attempts fail due to validation or API errors (monitored via server logs).
- Zero privacy incidents related to unauthorized location disclosure post-launch.

---

## 🗺️ Rollout Plan
1. Land Supabase migration + type updates behind feature flag (`BROWSER_LOCATION_CAPTURE`).
2. Ship frontend capture & manual fallback tied to consent messaging; QA in staging with mock civic API keys.
3. Enable flag for a 5% beta cohort; validate telemetry and downstream personalization.
4. Gradually ramp to 100%, monitor consent opt-outs and database growth, then remove legacy mock data paths.

---

## 🧭 Maintainer Action Checklist

### Before Development
- [ ] Provision Supabase/Vercel secrets (Census Geocoder, Nominatim proxy if needed, Google Civic) in the target environment; never commit real keys.
- [ ] Confirm `BROWSER_LOCATION_CAPTURE` and `CIVICS_ADDRESS_LOOKUP` feature flags remain disabled in production until QA completes.
- [ ] Run existing migrations/tests to ensure baseline MVP remains green.

### Schema & ETL
- [ ] Create Supabase migration files for:
  - `civic_jurisdictions`
  - `jurisdiction_aliases`
  - `jurisdiction_geometries`
  - `jurisdiction_tiles`
  - `candidate_jurisdictions`
  - `user_location_resolutions`
  - `location_consent_audit`
- [ ] Generate Supabase types (`utils/supabase/client.ts`, `utils/supabase/server.ts`) and update Zod schemas (`lib/validation/schemas.ts`).
- [ ] Author `scripts/etl/generate-jurisdictions.ts` to ingest TIGER/Line, Open Civic Data, OpenStates shapes into the new tables.
- [ ] Document backfill + rollback steps in `docs/ROADMAP.md`.

### Resolver & API
- [ ] Implement resolver utility that queries Census → Nominatim → Google Civic, normalizes into the OCD bundle, and caches results.
- [ ] Refactor `/api/v1/civics/address-lookup` to require auth, log anonymized metrics, and persist to `user_location_resolutions` + `location_consent_audit`.
- [ ] Add rate limiting and feature-flag guardrails; ensure revocation deletes precise fields.

### Frontend & UX
- [ ] Update `LocationInput` onboarding flow to display new permission states, retries, and fallback messaging.
- [ ] Block onboarding progression until resolver persistence succeeds; surface consent copy.
- [ ] Add profile settings UI for re-running geolocation, displaying last updated, and deleting stored coordinates.
- [ ] Introduce visualization toggles for trust tier & consented heuristics.

### Downstream Consumption & Visualization
- [ ] Update `lib/civics/geographic-service.ts` and `lib/electoral/geographic-feed.ts` to consume `civic_jurisdictions` / `candidate_jurisdictions`.
- [ ] Build Supabase materialized views / cron job for H3 heatmap tiles and heuristic aggregates (demographics, interests, trust tiers).
- [ ] Document API contracts returning aggregated data only; add client hooks.

### Telemetry & Testing
- [ ] Instrument resolver analytics (source, cache hit, fallback) without logging addresses.
- [ ] Extend unit/integration/e2e tests as outlined (quantization, consent revoke, geolocation flows).
- [ ] Verify privacy pepper rotation scripts and consent revocation flows still pass.

### Pre-Launch
- [ ] Execute manual QA checklist (permission grant/deny, consent revoke, visualization toggles, trust tier filters).
- [ ] Validate Supabase logs confirm no raw location data stored or emitted.
- [ ] Update documentation (PRD, ROADMAP, feature READMEs) with final architecture and operational playbooks.
- [ ] Notify stakeholders and schedule gradual feature-flag rollout.
