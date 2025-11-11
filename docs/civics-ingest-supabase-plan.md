# Civics Ingest → Supabase Utilization Plan

> **Reference status:** This is a roadmap for engineering work on the SQL merge. Day-to-day operators should rely on [`docs/civics-backend-quickstart.md`](./civics-backend-quickstart.md) and [`docs/civics-backend-operations.md`](./civics-backend-operations.md) for run instructions.

This document enumerates the outstanding work needed to ensure the rebuilt civics ingest service fully exercises the Supabase schema. The existing ingest and enrichment flows still focus on `representatives_core`; the goal is to persist normalized, auditable data across every related table whenever we load or refresh representatives.

## Goals

1. **Active-only canonical records** stay idempotent and deduplicated across reruns.
2. **Every downstream table** (contacts, social, committees, photos, data provenance, finance) receives fresh, deterministic payloads.
3. **Quality and provenance metadata** becomes first-class, so auditors can trace every field to a source and see validation history.
4. **Future enrichments** (FEC, OpenStates bills, GovTrack) slot into the same canonical IDs without schema churn.

## Table-by-Table Plan

| Table | Current usage | Gaps | Required ingest action |
| ----- | ------------- | ---- | ---------------------- |
| `representatives_core` | Filled via YAML + Supabase merge | `data_sources`, verification state, and some term metadata still pending | Map canonical roles to `level`, `office`, `district`, `term_*`, maintain `data_sources`, and persist `verification_status` |
| `representative_contacts` | **Synced via `npm run sync:contacts`** | Committee/staff-specific contacts not yet captured | Expand to include capitol/district office metadata; consider secondary sources |
| `representative_social_media` | **Synced via `npm run sync:social`** | Influence metrics and verification proofs missing | Optionally enrich with follower counts / verification evidence |
| `representative_photos` | **Synced via `npm run sync:photos`** | Alternate angles / congressional portraits not yet fetched | Add additional sources with attribution metadata where available |
| `representative_committees` | **Partially populated via `sync:committees`** | Federal + state committee data still missing from SQL merge | Extend merge pipeline to replace per-representative REST write; add federal Congress.gov committees |
| `representative_activity` | **Populated via `sync:activity` (OpenStates bills, auto-run post-merge)** | Additional sources (Congress.gov votes, GovTrack) not yet ingested | Expand inputs beyond OpenStates; migrate logic into SQL merge/orchestrator |
| `id_crosswalk` | Partially populated | Quality scores missing, conflicting FEC IDs handled manually | Continue using `applyCrosswalkToRepresentative`; on ingest, upsert deterministic mappings per canonical ID with `quality_score` attribute |
| `representative_crosswalk_enhanced` / `representative_enhanced_crosswalk` | Unused | Intended for richer metadata | Decide on a single table (likely `representative_crosswalk_enhanced`) and persist external attrs (confidence, last_verified) from orchestrator |
| `representative_data_sources` | **Synced via `npm run sync:data-sources`** | Raw payload hashes & validation metadata still optional | Consider storing payload excerpts / hash digests for audit trail |
| `representative_data_quality` | Populated by SQL merge baseline | Finance enrichment did not persist updates | Finance enrichment now upserts freshness/completeness; extend SQL merge to capture state-specific metrics |
| `representative_campaign_finance` | Populated with totals | Cycle metadata now available after widening | Update FEC enrichment to write new columns (`cycle`, `small_donor_percentage`, `top_contributors`, `office_code`, `district`, `sources`) – already implemented |

## Implementation Checklist

1. ✅ **Canonical builder (`ingest/openstates/people.ts`)**
   - Social handles and photo URLs now flow through to persistence utilities.
   - Offices classified to infer primary contacts.

2. ✅ **Supabase merge layer (`ingest/supabase/representatives.ts`)**
   - Merges Supabase social/photo data into canonical reps.
   - Chunked `.in()` queries avoid Cloudflare 414 errors.

3. 🔄 **Write modules for normalized tables**
   - ✅ Contacts (`sync:contacts`)
   - ✅ Social (`sync:social`)
   - ✅ Photos (`sync:photos`)
   - ⏳ Committees/activities still pending.

4. 🔄 **Provenance + quality logging**
   - ✅ `representative_data_sources` via `sync:data-sources`.
   - ⚙️ TODO: persist `representative_data_quality` metrics and notes.

5. ⚙️ **Enrichment orchestration (planned)**
   - TODO: extend state/federal enrichers with committee/activity payloads and crosswalk updates.

6. ✅ **CLI commands**
   - Contacts, social, photos, finance, audit/fix scripts published with consistent `--dry-run` behaviour.

7. ⚙️ **Validation + auditing (planned)**
   - TODO: add regression tests and expanded crosswalk auditing.

## Upcoming Roadmap (Federal + State Enrichment)

### Phase 1 — Baseline & Reporting
- Run `npm run ingest:qa` and `npm run preview -- --states=CA --limit=5` to confirm a clean baseline.
- Generate gap reports:
  - Federal representatives with `fec_id` but no `representative_campaign_finance` row.
  - Federal representatives missing `congress_gov_id` / `govinfo_id`.
  - State representatives missing core contact fields (phone/email/website).
- Capture API notes (current rate limits, error types, typical response sizes) for FEC and OpenStates.

### Phase 2 — Congress.gov & GovInfo Identifier Push
- Build `npm run enrich:congress-ids` to download the official Congress.gov member export (includes GovInfo identifiers) and upsert `congress_gov_id` / `govinfo_id`.
- Backfill bioguide/FEC/Congress.gov crosswalks where missing; update `representative_data_sources` with provenance (`congress_gov_member_export`).
- Extend `report:gaps` to show remaining missing identifiers until the backlog hits zero.
- Re-run `npm run ingest:qa` after the first sync to verify schema alignment and spot-check a sample of updated reps.

### Phase 3 — Finance Enhancements (FEC)
- Continue batching `npm run enrich:finance` with controlled `--limit`/`--offset`/`--states`.
- Default runs still target missing/stale rows; use `--stale-days=<n>` for refresher batches, `--include-existing` for full rebuilds.
- Persist `fec:no-data` placeholders so repeat cron jobs skip empty totals until stale; `report:gaps` surfaces these separately.
- Append run metrics (processed/succeeded/rate-limited) to the shared ingest log; re-run `npm run ingest:qa` for verification.

### Phase 4 — Congress.gov Activity
- Document Congress.gov committee endpoints and plan a lightweight fetch for federal committee assignments.
- Implement `npm run enrich:congress-activity` (or similar) to populate `representative_committees` and `representative_activity` with official committee assignments, votes, and bill sponsorship summaries.
- Cache raw payloads, store hashes/provenance in `representative_data_sources`, and update docs as coverage lands.

### Phase 5 — OpenStates API Enrichment (State Contacts/Social)
- Identify remaining state-level contact/social gaps via Supabase queries.
- Prototype OpenStates API fetches (respect rate limits); design `npm run enrich:openstates-api -- --states=CA --limit=50 --dry-run`.
- Roll out contacts, then committees/social/activity; persist payloads in `representative_data_sources.raw_data`. (`sync:committees`/`sync:activity` cover interim OpenStates writes → Supabase tables.)
- Update docs (`README`, operations guide) and re-run `npm run ingest:qa` after each new data class.

## Sequencing / Milestones

1. **Milestone A – Contacts & Social (P0)**
   - Structured writes for contacts/social/photos + provenance logs.
   - Data quality scoring persisted.

2. **Milestone B – Committee & Activity Enrichment (P1)**
   - Federal committee pull (GovTrack / Congress.gov) + state committees (OpenStates).
   - Framework in place for vote/activity ingestion.

3. **Milestone C – Crosswalk Hardening (P1)**
   - Deterministic canonical IDs, automated conflict resolution, enhanced crosswalk population.

4. **Milestone D – Analytics & Auditing (P2)**
   - Routine jobs to reconcile finance cycles, detect stale data (`representative_data_sources.last_updated` > threshold), and alert when critical fields regress.

## Dependencies

- **Supabase credentials** (`SUPABASE_SERVICE_ROLE_KEY`) scoped for writes to all tables above.
- **API keys** (Google Civic, GovInfo, OpenStates, Congress.gov, FEC) already stored in `.env.local`.
- **Testing fixtures** for OpenStates YAML and mock API responses to guarantee deterministic unit tests.

---

Maintaining this plan alongside `docs/product-quality-roadmap.md` ensures that every ingest iteration tracks which Supabase tables are populated and which still need work. Update this file as milestones land to keep external contributors apprised of schema coverage.

