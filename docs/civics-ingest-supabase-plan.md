# Civics Ingest → Supabase Utilization Plan

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
| `representative_committees` | Unused | Committee memberships available via OpenStates / Congress APIs | Extend orchestrator enrichment to fetch committees and upsert with start/end dates and roles |
| `representative_activity` | Unused | Future: votes/bills/events | Reserve for bill/vote ingestion; ensure orchestrator returns normalized activity payloads |
| `id_crosswalk` | Partially populated | Quality scores missing, conflicting FEC IDs handled manually | Continue using `applyCrosswalkToRepresentative`; on ingest, upsert deterministic mappings per canonical ID with `quality_score` attribute |
| `representative_crosswalk_enhanced` / `representative_enhanced_crosswalk` | Unused | Intended for richer metadata | Decide on a single table (likely `representative_crosswalk_enhanced`) and persist external attrs (confidence, last_verified) from orchestrator |
| `representative_data_sources` | **Synced via `npm run sync:data-sources`** | Raw payload hashes & validation metadata still optional | Consider storing payload excerpts / hash digests for audit trail |
| `representative_data_quality` | Unused | Quality notes only printed in console | Persist completeness/freshness metrics + validation method per run; include JSON notes if we widen schema |
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
- **API keys** (FEC, OpenStates, Google Civic, GovTrack, Congress.gov) already stored in `.env.local`.
- **Testing fixtures** for OpenStates YAML and mock API responses to guarantee deterministic unit tests.

---

Maintaining this plan alongside `docs/product-quality-roadmap.md` ensures that every ingest iteration tracks which Supabase tables are populated and which still need work. Update this file as milestones land to keep external contributors apprised of schema coverage.

