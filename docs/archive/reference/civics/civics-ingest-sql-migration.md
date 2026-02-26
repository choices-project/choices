# Civics Ingest — SQL Migration Plan

> **ARCHIVED.** Use [OPERATOR_RUNBOOK.md](../../../services/civics-backend/NEW_civics_ingest/docs/OPERATOR_RUNBOOK.md) and [DATABASE_SCHEMA.md](../../../services/civics-backend/NEW_civics_ingest/docs/DATABASE_SCHEMA.md). This file is historical only.

This document outlines how we graduate the current per-representative REST ingest into a Supabase-native, set-based workflow. It will serve as the working blueprint while we refactor the pipeline.

---

## Objectives

- **Stage OpenStates data once** in dedicated tables; avoid streaming per-representative inserts.
- **Materialize canonical representatives** via SQL procedures, enforcing the desired shapes and uniqueness constraints.
- **Share a single source of truth** for both backend and frontend via Supabase-generated types.
- **Minimise API chatter** by replacing thousands of REST calls with a handful of bulk operations.

---

## Target Architecture

```
OpenStates YAML ─┐                 ┌─ representative_contacts
                 ├─ (bulk stage) ──┼─ representative_social_media
Supabase core ───┘                 ├─ representative_photos
                                   ├─ representative_committees
                                   ├─ representative_activity
            SQL merge function ────┼─ representative_data_sources
                                   ├─ representative_data_quality
                                   └─ representatives_core (canonical IDs)
```

### Staging tables (existing)

- `openstates_people_data`
- `openstates_people_contacts`
- `openstates_people_roles`
- `openstates_people_identifiers`
- `openstates_people_other_names`
- `openstates_people_social_media`
- `openstates_people_sources`

### Canonical tables (existing)

- `representatives_core`
- `representative_contacts`
- `representative_social_media`
- `representative_photos`
- `representative_committees`
- `representative_activity`
- `representative_data_sources`
- `representative_data_quality`
- `representative_campaign_finance`
- `representative_crosswalk_enhanced`
- `id_crosswalk`

---

## Work Plan

### 1. Stage loader
- Stream OpenStates YAML files.
- Insert into staging tables in batches (1000 rows) using Supabase bulk inserts or `COPY`.
- Store source file hashes/timestamps to skip unchanged files.
  ✅ Implemented in `src/scripts/stage-openstates.ts` (bulk upsert with chunked deletes).

### 2. SQL merge procedure
- Migration to create `sync_representatives_from_openstates()` (or similar).
  - Responsibilities:
  - Upsert canonical rows into `representatives_core` (state/local) and merge with federal rows.
  - Populate child tables via `INSERT … ON CONFLICT DO UPDATE`, ensuring unique constraints are satisfied.
  - Aggregate provenance data into `representative_data_sources`.
  - Compute `representative_data_quality` metrics in SQL.
  - Optionally purge/flag staged rows after processing.

### 3. CLI refactor
- Replace per-representative REST loops with:
  - `npm run ingest:openstates` → stage loader + SQL merge call.
  - Keep finance enrichment CLI (calls FEC API) but rely on SQL for persistence.
- Generate Supabase types in `services/civics-backend` for compile-time safety.

### 4. Decommission legacy scripts
- Remove `state:sync:contacts`, `state:sync:social`, `state:sync:photos`, `state:sync:data-sources` JS implementations once SQL workflow is live.
- Update documentation (`README`, operations guide) to reflect the new flow.

### 5. Extensions (future)
- Committee/activity enrichment inside SQL.
- Quality scoring enhancements (e.g., freshness by data source, last validated dates).
- Scheduled Supabase cron job to execute the merge periodically.

---

## Next Steps

1. Draft the SQL migration (staging views + merge function skeleton). **✅ Helper views + implemented merge function (`20251108023000_sync_representatives_function_v2.sql`).**
2. Prototype the stage loader script and verify batch inserts. **✅ `npm run openstates:stage`.**
3. Iterate on conflict resolution strategies (shared hotlines, shared emails). **← Legacy writers still enforce dedupe; evaluate SQL approach next.**
4. Update docs and remove redundant scripts after successful end-to-end test. **← pending once SQL pipeline replaces legacy writers.**

This file will be updated as each step lands.

---

## Pre-flight checklist (before writing the migration)

- [ ] Inspect existing constraints/indexes on `representatives_*` and `openstates_*` tables.
- [ ] List current RLS policies (`pg_policy`) and ensure the merge function either runs with `SECURITY DEFINER` or respects them.
- [ ] Capture existing triggers/functions touching these tables to avoid accidental overrides.
- [ ] Confirm conflict targets (`canonical_id`, `(representative_id, contact_type, value)`, etc.) and ensure matching unique indexes exist.
- [ ] Decide how to handle shared contact values (hotlines) so uniqueness is preserved without data loss.

---

## Mapping blueprint

### Representatives core (`representatives_core`)
| Target column | Source / derivation | Notes |
| --- | --- | --- |
| `openstates_id` | `openstates_people_data.openstates_id` | Primary join key for state/local records |
| `name` | `openstates_people_data.name` | |
| `given_name` / `family_name` | `openstates_people_data.given_name`, `family_name` | stored in staging extras |
| `office` | Derived from current role title/member_role | fallback to jurisdiction type |
| `level` | `CASE WHEN role_type IN ('upper','lower') THEN 'state' ELSE 'local'` | federal rows pre-exist in Supabase |
| `state` | Lowercased state code inferred from jurisdiction (view) | |
| `district` | `openstates_people_current_roles_v.district` | |
| `party` | `openstates_people_data.party` (current) | |
| `primary_email` / `primary_phone` | Marked primary entries from `openstates_people_primary_contacts_v` | |
| `primary_website` | Prefer contact_type `url` or `website` values | |
| `primary_photo_url` | `openstates_people_data.image_url` | |
| Social handles | Join with Supabase existing data (coalesce) + staged social view | merge rather than overwrite |
| `term_start_date`, `term_end_date` | Current role start/end | null when unknown |
| `data_sources` | Aggregated from `representative_data_sources` (post merge) | maintained after provenance step |
| `verification_status` | Placeholder `'unverified'` unless Supabase row already has value | |

### Contacts (`representative_contacts`)
- Source data: `openstates_people_primary_contacts_v`.
- Store one row per `(representative_id, contact_type, value)`; shared hotlines resolved by appending canonical ID if necessary.
- Preserve notes (`note`) in JSON metadata column or drop? (candidate to put into `is_verified`/`source` fields).

### Social (`representative_social_media`)
- Use normalized platforms (lowercase).
- Coalesce handle with existing Supabase values; avoid inserting duplicates.
- `url` currently null; we can synthesise `https://{platform}.com/{handle}` later.

### Photos (`representative_photos`)
- Upsert portrait from `openstates_people_data.image_url`.
- Use `ON CONFLICT (representative_id, source)` to keep single primary record per source.

### Committees (`representative_committees`)
- Derived from `openstates_people_roles` entries whose `role_type` is not legislative/executive (treated as committee/task force membership).
- `committee_name` defaults to role `title`/`member_role`; `is_current` based on end date.
- `npm run state:sync:committees` performs the legacy delete+insert flow until SQL merge covers this table.

### Data sources (`representative_data_sources`)
- Derived from `openstates_people_sources_v` plus Supabase-specific tokens (`supabase:representatives_core`, `crosswalk:*`).
- Confidence defaults: OpenStates `high`, wiki/ballotpedia `medium/low`.

### Data quality (`representative_data_quality`)
- Compute completeness based on presence of email/phone/address/social, finance info.
- Freshness based on `openstates_people_data.updated_at` and latest finance cycle.

### Crosswalk (`representative_crosswalk_enhanced`)
- Populated from OpenStates identifiers (wikipedia, ballotpedia, bioguide, fec, etc.).
- `source_confidence` varies by scheme; attrs store start/end metadata.

### Committees & activity
- Roles view already provides `jurisdiction` + `member_role`; use to populate `representative_committees` (currently via `state:sync:committees`).
- Activity table populated via OpenStates bills (`state:sync:activity`); migrate to SQL-first ingest alongside future Congress.gov vote feeds.

---

## Outstanding design questions

- Should we preserve every OpenStates contact, or only "primary" ones? (Current approach: primary only, optional toggle.)
- How do we represent shared legislative hotlines without violating unique constraints? (Option: store canonical `_shared` entries per state and link via a junction table.)
- Do we need historical role tracking inside `representative_activity` or a new table?
- What is the authoritative source for `verification_status`? (Manual overrides from admin UI vs. automated status.)

These questions should be resolved before the merge function is finalised.

