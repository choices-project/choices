# [ARCHIVED] Voter Registration Integration Roadmap
Active work and status live in:
- `docs/ROADMAP_SINGLE_SOURCE.md`
- `docs/STATE_MANAGEMENT.md` (store patterns)

**Goal:** Attach a state-appropriate voter registration call-to-action to the address lookup experience so every user gets a single authoritative next step without leaving the civics flow.

**Scope:** `services/civics-backend`, Supabase schema, `web` application (API + stores + components), operations, analytics, QA.

**Target Outcome:** When a user submits an address, the app resolves jurisdiction, surfaces representatives, and renders one voter-registration CTA (online link or mail workflow) sourced from curated state metadata.

---

## Phase 0 – Discovery & Alignment

- [x] Confirm product acceptance criteria (UX copy, placement, accessibility requirements, analytics events).
- [x] Identify official data sources:
  - Vote.gov JSON (online portals + printable forms).
  - USAGov / EAC feeds (state election office addresses, status checks).
  - Manual notes for outliers (North Dakota, territories, military voters).
- [x] Inventory existing API quotas and keys (Vote.gov/USAGov are public; no auth required, but add contact headers).
- [x] Draft Supabase schema sketch and share with data team for review.
- [ ] Validate legal/compliance requirements (e.g., disclaimers, data freshness commitments).
- [x] Agree on release timeline, feature flag plan, and rollback strategy.

Deliverable: Requirements summary + signed-off schema draft.

---

## Phase 1 – Backend Data Ingest (`services/civics-backend`)

### 1.1 Schema Prep

- [x] Generate Supabase migration:
  - Table `voter_registration_resources`
    - `state_code` (`text`, PK, uppercase 2-letter).
    - `online_url` (`text`, nullable).
    - `mail_form_url` (`text`, nullable).
    - `mailing_address` (`text`, nullable).
    - `election_office_name` (`text`, nullable).
    - `status_check_url` (`text`, nullable).
    - `special_instructions` (`text`, nullable).
    - `sources` (`text[]`, default `{}`).
    - `metadata` (`jsonb`, optional for edge cases).
    - `last_verified` (`timestamptz`, default `now()`).
    - `created_at` / `updated_at`.
  - View `voter_registration_resources_view` exposing the core columns for read-only selectors.
  - Seed SQL for initial manual overrides (ND, territories) if the public feed lacks them.
  - ✅ Implemented in `supabase/migrations/20251113090000_voter_registration_resources.sql`.
- [x] Run migration locally, regenerate `web/types/supabase.ts`.

### 1.2 Ingest Script

- [x] Create `src/scripts/state/sync-voter-registration.ts`:
  - Fetch Vote.gov JSON (state list).
  - Optional: Fetch USAGov/EAC endpoint for mailing addresses.
  - Normalise into canonical `VoterRegistrationResource` objects.
  - Merge data sources (online + mail + instructions).
  - Upsert into Supabase table (replace-by-source semantics).
  - Track metadata (`sources` array, `last_verified`).
- [x] Add CLI entry in `package.json` (`npm run state:sync:voter-registration`).
- [x] Update `services/README.md` + `docs/civics-backend-quickstart.md` with setup instructions and scheduling guidance.
- [ ] Add unit tests/mocks (where practical) and script dry-run logging.

### 1.3 Operationalisation

- [ ] Document run cadence (monthly or when Vote.gov updates).
- [ ] Hook into existing Supabase change notification / Slack alerts.
- [x] Ensure `.env.example` and secrets are unchanged (Vote.gov is public; no keys).
- [ ] Create “data freshness” monitor: simple script that warns if `last_verified` older than SLA (e.g., 45 days).

Deliverable: Production-ready ingest pipeline and populated Supabase table. ✅ (Vote.gov JSON ingested for all 56 states/territories; `npm run state:sync:voter-registration` seeds Supabase.)

---

## Phase 2 – Web API Layer

### 2.1 API Route

- [x] Implement `web/app/api/v1/civics/voter-registration/route.ts`:
  - Accept `state` (2-letter) or `division` (OCD ID).
  - Parse state code (extract `state:xx` from OCD or validate `state` param).
  - Query Supabase view (service role key, same as other civics routes).
  - Return `{ data: resource | null }`.
  - Set cache headers (`public, max-age=86400, stale-while-revalidate=604800`).
  - Add error handling and validation (400 on missing/invalid state).
- [ ] Add integration tests (mock Supabase client).
- [ ] Update API documentation (`docs/civics-api.md` or equivalent).

### 2.2 Request Helpers

- [x] If needed, create helper util `getStateFromDivision(divisionId: string)` shared by API + client/store.
- [x] Ensure existing feature flag/permissions logic is respected (route accessible when CIVICS is enabled).

Deliverable: Public API route retrieving canonical voter registration resources.

---

## Phase 3 – Client Stores & Hooks

### 3.1 Zustand Store

- [x] Add `web/lib/stores/voterRegistrationStore.ts`:
  - State: `resourcesByState`, `isLoading`, `error`.
  - Actions: `fetchRegistrationForState(stateCode)`, `clearResources`.
  - Cache by uppercase state code; skip fetch if already cached and fresh (optional TTL).
  - Provide hooks `useVoterRegistration(stateCode)`, `useRegistrationLoading`, `useRegistrationError`.
- [x] Unit tests for the store (mock fetch response, cache behaviour, error path).

### 3.2 Derived State Helpers

- [x] Utility to derive state code from OCD division: extend `features/civics/utils/divisions.ts` or add new file.
- [ ] Consider returning `stateCode` along with representatives in existing `findByLocation` response to avoid duplicate parsing (optional improvement).

Deliverable: Client-side state layer exposing voter registration data keyed by state.

---

## Phase 4 – UI Integration

### 4.1 Address Lookup Form

- [x] Update `AddressLookupForm`:
  - After successful lookup, derive state code from `userDivisionIds` (first containing `state:XX`).
  - Trigger `fetchRegistrationForState(stateCode)` (side-effect similar to elections fetch).
  - Persist derived state code in component state for downstream components.
- [x] Ensure loading/error states are gracefully handled (avoid double spinners).

### 4.2 Voter Registration CTA Component

- [x] Create `VoterRegistrationCTA.tsx` under civics components:
  - Props: `resource`, `stateCode`, `isLoading`, `error`.
  - Cases:
    - Online portal available → primary button linking to `online_url`.
    - Mail form only → button to download form + show mailing address (formatted).
    - Special instructions (ND, territories) → display callout.
    - Status check URL → optional secondary link.
    - No data → fallback message linking to Vote.gov homepage.
  - Include `last_verified` text (e.g., “Updated Nov 13, 2025”).
  - Accessibility: button semantics, `aria-live` for loading, focus management.
  - Analytics: expose `onClick` to track events via existing civics analytics hook.
- [x] Added “Learn About Registration” button (Vote.gov `more_info` fallback to homepage).

### 4.3 Placement

- [x] Insert CTA component below the submit button or in the results panel:
  - Example: `VoterRegistrationCTA` rendered between the address form and representative list.
  - Ensure layout responsive (mobile first).
  - Optionally hide CTA until after first successful lookup.

### 4.4 Styling & Copy

- [x] Use existing design tokens (colors, spacing).
- [x] Copy guideline:
  - Online: “Register to vote online in {State}”.
  - Mail: “Download the {State} registration form” + instructions.
  - Status check: “Check your registration status”.
- [ ] Confirm with content/brand team.

Deliverable: Visible CTA automatically updated per state after address lookup.

---

## Phase 5 – Analytics & QA

- [ ] Add CTA click tracking (e.g., `trackCtaEvent('civics_voter_registration_click', { state: 'CA', method: 'online' })`).
- [ ] Update privacy policy if necessary (surfacing external URLs).
- [ ] Manual QA checklist:
  - States with online registration (CA, FL).
  - Mail-only states (WY example).
  - North Dakota (no registration required).
  - Territories (PR, GU).
  - Offline scenario: API returns null (CTA should show fallback).
  - Accessibility: keyboard navigation, screen reader text.
- [ ] Automated tests:
  - Component tests verifying each CTA scenario.
  - End-to-end test (mock network) ensuring CTA appears after address submission.
- [ ] Performance check: confirm additional fetch does not block UI (loading indicator, concurrency).

Deliverable: Verified feature with analytics visibility and QA sign-off.

---

## Phase 6 – Launch & Maintenance

- [ ] Feature flag gating (optional): wrap CTA in `isFeatureEnabled('CIVICS_VOTER_REGISTRATION')`.
- [ ] Stage → Prod rollout checklist:
  - Deploy Supabase migration.
  - Run ingest script (prod credentials) and verify rows (spot-check 5 states).
  - Deploy web API + UI.
  - Smoke test address lookup in production environment.
- [ ] Announce internally (release notes, changelog update).
- [ ] Schedule recurring ingest (cron, GitHub Actions, or manual with reminders).
- [ ] Monitor analytics and error logs for first week post-launch.

---

## Dependencies & Risks

- **External feeds**: Vote.gov structure changes; mitigation: wrap parser with defensive coding and add monitor that alerts when feed schema drifts.
- **Supabase service role**: Ensure environment variables available in deployment targets (Vercel, etc.).
- **Rate limits**: Vote.gov endpoints are static; low risk. API route caches results to minimise traffic.
- **Fallback quality**: Some states require county-level branching; plan for future support via second table keyed by county OCD if necessary.
- **Legal copy**: Confirm disclaimers required when linking to government sites.

---

## Success Metrics

- CTA click-through rate per state.
- Drop-off rate between address submission and registration engagement.
- Data freshness: proportion of states with `last_verified < 45 days`.
- Error rate on API route (should remain near 0).

---

## Suggested Timeline (Ideal, Adjustable)

| Week | Milestone |
|------|-----------|
| 1 | Phase 0 completion, schema approved |
| 2 | Supabase migration + ingest script ready |
| 3 | API route + store implemented |
| 4 | UI integration + component testing |
| 5 | QA, analytics wiring, documentation |
| 6 | Launch prep, ingest scheduling, release |

---

## Appendices

### Data Source Reference

- Vote.gov state data JSON: `https://vote.gov/assets/data/` (confirm current endpoint).
- USAGov election office list: `https://www.usa.gov/api/USAGovAPI/contacts/state-election-office`.
- EAC resources (if necessary): `https://www.eac.gov/voters/register-and-vote-in-your-state`.

### Future Enhancements

- County-level overrides for states requiring local offices.
- Integrate automatic registration status checks.
- Personalised reminders before registration deadlines (requires storing jurisdiction with consent).
- Localization/internationalization for Spanish audiences.

---

**Owner:** Civics Platform Team  
**Last updated:** <!-- maintain manually when changes occur -->

