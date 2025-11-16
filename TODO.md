## Engineering Roadmap: TODOs, Placeholders, and Not-Implemented Surfaces

This document tracks identified trap comments, placeholders, and intentionally unimplemented areas. For each item: current state, surrounding context, and a recommendation on whether/how to implement.

### Legend
- Priority: P0 (urgent), P1 (near-term), P2 (backlog), P3 (nice-to-have)
- Owner suggestions are indicative; adjust per team charter.

---

### 1) Analytics Widgets: Configuration UI
- Paths:
  - `web/features/analytics/components/widgets/WidgetRenderer.tsx`
  - `web/features/analytics/components/widgets/WidgetDashboard.tsx`
- Current state:
  - Renderer shows a modal/panel when configuring a widget but lacks per-widget form controls.
  - Dashboard has a TODO for opening global settings.
- Context:
  - Widgets are registered via `widgetRegistry` with metadata and sizes; the dashboard supports edit/save flows, presets, and accessibility/keyboard controls.
- Recommendation:
  - Implement a schema-driven config system per widget type with zod schemas and a small form renderer (ShadCN UI + zod-form-resolver).
  - Add `onConfigChange` wiring in `WidgetRenderer` to persist to the `widgetStore` and to the backend layout save.
  - In `WidgetDashboard.tsx`, implement the Settings button as a popover or a side panel for global dashboard options (e.g., grid density, default preset, data refresh interval).
- Priority: P1
- Suggested Owner: Web Analytics UI

---

### 2) Representative Store: Populate `user_id` during hydration
- Path: `web/lib/stores/representativeStore.ts` (normalization in `getUserRepresentatives`)
- Current state:
  - Normalized `UserRepresentative` entries set `user_id: '' // TODO`.
- Context:
  - The fetch `/api/representatives/my` returns follow records and representative detail; we have authenticated context available elsewhere (Supabase).
- Recommendation:
  - Use authenticated user context from a central auth hook/provider on the client, or populate on the server route that returns the entries (preferred). If the API can include `user_id`, map directly; otherwise, pass `userId` into the hydration call and set it at normalization time.
  - Add type-safe guards to ensure `user_id` is always present for followed entries.
- Priority: P0
- Suggested Owner: Web Civic Data

---

### 3) Unified Data Orchestrator: Placeholders and “TBD”
- Path: `web/lib/integrations/unified-orchestrator.ts`
- Current state:
  - Placeholder representatives (`Incumbent TBD`) and `TBD` deadlines used for fallbacks.
  - Multiple methods explicitly throw `NotImplementedError` for deeper analysis (e.g., post-government employment, corporate connections, policy positions).
- Context:
  - Orchestrates Google Civic, FEC, OpenSecrets, GovTrack, OpenStates integrations; also provides fallbacks and quality scoring.
- Recommendation:
  - Keep `NotImplementedError` surfaces for not-in-MVP analyses; ensure callers handle gracefully (they already do).
  - Replace visible user-facing “TBD” with computed estimates where possible, or present user-friendly copy (e.g., “Pending official schedule”) while telemetry counts frequency to prioritize.
  - For minimal improvement, replace `TBD` strings in the fallback race with `estimateDeadline` calls where date is available and hide fields when not applicable.
- Priority: P1
- Suggested Owner: Civics Data Platform

---

### 4) Geographic Electoral Feed: Fallbacks on Not Implemented
- Path: `web/lib/electoral/geographic-feed.ts`
- Current state:
  - Gracefully falls back to mock races when upstream orchestrator signals not implemented (upcoming elections, campaign enrichment, jurisdiction key issues).
- Context:
  - The feed is robust to partial data and already logs appropriately.
- Recommendation:
  - No immediate change required. Track rate of fallbacks via metrics logger and promote upstream integrations in the orchestrator (Items 3 and 7).
  - Add a feature flag to switch between strict (no placeholders) vs. lenient (fallbacks) behavior in pre-prod environments for QA signal.
- Priority: P2
- Suggested Owner: Civics Data Platform

---

### 5) Location Service: Reverse-geocoding by coordinates
- Path: `web/lib/services/location-service.ts`
- Current state:
  - `findRepresentativesByCoordinates` logs “not implemented yet” and returns null.
- Context:
  - `geocodeAddress` currently uses mock data but has a commented Google Geocoding API path.
- Recommendation:
  - Implement reverse geocoding via Google Maps Geocoding API or Nominatim (OpenStreetMap) with a server-side proxy to hide API keys. Return `LocationResult` then reuse representative fetch logic.
  - Add caching and basic rate limiting.
- Priority: P1
- Suggested Owner: Platform Services

---

### 6) Civics Photo Service: Wikipedia integration
- Path: `web/features/civics/lib/civics/photo-service.ts`
- Current state:
  - `getWikipediaPhoto` returns null with “not implemented yet” log.
- Context:
  - Uses Congress.gov photo URL if `bioguideId` is present, else placeholder via ui-avatars.
- Recommendation:
  - Implement Wikipedia lookup using the MediaWiki API (search by name -> page image -> info). Normalize licensing and attribution fields. Cache results by representative ID.
  - Add a simple confidence heuristic (match name + state/district if available).
- Priority: P2
- Suggested Owner: Civics Data Platform

---

### 7) Analytics Service: Database surfaces not yet implemented
- Path: `web/features/analytics/lib/analytics-service.ts`
- Current state:
  - Warns if RPC `update_poll_demographic_insights` not present.
  - Warns if table `civic_database_entries` not present; code continues without throwing.
- Context:
  - The rest of the analytics pipeline functions; this is additive persistence/enrichment.
- Recommendation:
  - Add migrations to create `civic_database_entries` and implement `update_poll_demographic_insights` RPC function. Document in DB schema ADR.
  - Until then, keep graceful degradation. Consider feature flags in API routes to avoid user-visible inconsistencies.
- Priority: P1
- Suggested Owner: Data Engineering

---

### 8) Onboarding Action: Production path placeholder
- Path: `web/app/actions/complete-onboarding.ts`
- Current state:
  - Simple action logs “Production path not implemented yet” in the non-secure helper; secure action is fully implemented and redirects after updating profile.
- Context:
  - The secure `completeOnboarding` path completes the job; the simple helper is for E2E testing.
- Recommendation:
  - Either remove the simple helper or wire it to delegate to the secure action to avoid confusion. Update tests accordingly.
- Priority: P2
- Suggested Owner: Platform Auth

---

### 9) Auth Utilities: Placeholders for getUser and validateSession
- Path: `web/lib/utils/auth.ts`
- Current state:
  - `getUser` returns `{ user: null }` and `validateSession` returns `{ valid: false, error: 'not implemented' }`.
- Context:
  - Project primarily uses Supabase auth flows elsewhere; these utilities are generic placeholders.
- Recommendation:
  - Either (a) remove this module where unused to avoid drift, or (b) implement thin wrappers over Supabase server/client helpers for consistent logging and typing.
  - If kept, mark as “legacy/shim” and route all new code to the Supabase-specific utilities.
- Priority: P2
- Suggested Owner: Platform Auth

---

### 10) Poll Hashtag Analytics: Integration stub
- Path: `web/features/polls/components/PollHashtagIntegration.tsx` (internal `_trackHashtagEngagement`)
- Current state:
  - TODO to integrate analytics service to persist hashtag engagement.
- Context:
  - Analytics service exists and can accept new metrics with a small table or `platform_analytics` general-purpose metric ingestion.
- Recommendation:
  - Add a lightweight endpoint or direct Supabase insert to record hashtag engagement events keyed by poll, user, action, and timestamp. Batch on client or debounce to reduce write frequency.
- Priority: P2
- Suggested Owner: Web Analytics UI

---

### 11) Internationalization strings using “TBD”
- Paths:
  - `web/lib/integrations/unified-orchestrator.ts` (deadline fallbacks)
  - `services/civics-shared/index.js` (`estimateDeadline` returns “TBD”)
- Current state:
  - “TBD” appears in data-layer fallbacks.
- Context:
  - Some UI may surface raw strings from data layer.
- Recommendation:
  - Replace “TBD” in data layer with null/undefined and let the UI render localized copy: “Pending” or hide the field. Track how often these appear via logging to prioritize data coverage.
- Priority: P2
- Suggested Owner: Civics Data Platform + Web UX

---

### 12) Tests referencing not-implemented warnings
- Path: `web/tests/archive/e2e-legacy/unified-feed.spec.ts`
- Current state:
  - Test asserts that “table not implemented” warnings do not appear in console.
- Context:
  - Defensive test ensures the UI is not noisy; the service logs still exist at dev level.
- Recommendation:
  - Keep the test. When the migrations land (Item 7), remove or loosen related test conditions as appropriate.
- Priority: P3
- Suggested Owner: QA

---

### Cross-Cutting Implementation Notes
- Error policy: Keep using `NotImplementedError` in services to make missing paths explicit in development, with graceful UI fallbacks.
- Feature flags: Add flags for strict vs. lenient fallback behavior to help QA and product sign-off (especially for civics feed surfaces).
- Telemetry: Instrument counters for how often fallbacks or nulls surface to guide prioritization.
- Documentation: When implementing DB migrations (Item 7), add brief ADR and update `docs/FEATURE_STATUS.md`.

---

### Prioritized Action List
1) P0: Populate `user_id` in `representativeStore` normalization or server API.
2) P1: Implement widget config UI + global dashboard settings action. (Implemented)
3) P1: Add reverse-geocoding flow in `LocationService` (server-proxied). (Implemented; requires Google API key)
4) P1: Land analytics DB migrations for `civic_database_entries` and `update_poll_demographic_insights`. (Implemented; added trigger to auto-refresh insights)
5) P2: Implement Wikipedia photo lookup in `CivicsPhotoService`.
6) P2: Replace data-layer “TBD” with null and render localized UI fallbacks.
7) P2: Wire hashtag engagement metrics persistence.
8) P2: Clean up onboarding helper to avoid confusion with secure action.
9) P2: Decide fate of `web/lib/utils/auth.ts` (remove or wire to Supabase).


