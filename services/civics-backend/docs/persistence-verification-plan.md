# OpenStates → Supabase Persistence Verification Plan

Keep this checklist updated as we tighten the ingest workflow. It covers manual verification, automated testing goals, and schema alignment so we can assert that the staged OpenStates data lands in Supabase exactly as expected.

---

## 1. End-to-end flow (current state)

```
OpenStates People YAML
        │
        ▼
scripts/openstates/stage-openstates.ts   (writes to openstates_people_* tables)
        │
        ▼
SQL helper views            (openstates_people_*_v materialise current roles,
                               primary contacts, deduped social handles, etc.)
        │
        ▼
sync_representatives_from_openstates()  (Supabase function)
        │
        ├─ representatives_core           (active state/local canonical rows)
        ├─ representative_contacts        (OpenStates-derived contacts)
        ├─ representative_social_media    (per-platform records)
        ├─ representative_photos          (portrait URLs)
        ├─ representative_committees      (non-legislative roles)
        ├─ representative_data_sources    (provenance payloads)
        └─ representative_data_quality    (basic completeness metrics)
```

Federal representatives remain in Supabase from other pipelines; OpenStates merge only adds/updates state & local rows where `openstates_id` matches.

---

## 2. Prerequisites

- Supabase CLI linked to the `muqwrehywjrbaeerjgfb` project (`supabase link`).
- `.env.local` loaded with `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`.
- Local OpenStates dataset under `services/civics-backend/data/openstates-people/data` (or point `OPENSTATES_PEOPLE_DIR` to fixtures).
- Optional: create a trimmed fixture set under `services/civics-backend/tests/fixtures/openstates/` for deterministic tests.

Run once per schema change:

```bash
cd /Users/alaughingkitsune/src/Choices/web
npx supabase gen types typescript --project-id muqwrehywjrbaeerjgfb > types/supabase.ts
```

---

## 3. Manual verification recipe

1. **Stage a limited dataset**
   ```bash
   cd services/civics-backend
   OPENSTATES_PEOPLE_DIR="$(pwd)/tests/fixtures/openstates" \
   npm run openstates:stage -- --states=CA --limit=50
   ```
   > Expect logs: “Loaded N OpenStates person records.” followed by per-table staging summaries.

2. **Run the SQL merge**
   ```bash
   npm run openstates:merge
   ```
   > The script prints `OpenStates sync complete: updated X, inserted Y, ...`.

3. **Confirm canonical rows (current-only)**
   ```sql
   select count(*) filter (where openstates_id is not null) as openstates_rows,
          count(*) filter (where openstates_id is not null and is_active = false) as inactive_rows
   from representatives_core;
   ```
   Expect `inactive_rows = 0` after a successful run. Spot check a sample:
   ```sql
   select name, state, office, term_start_date, term_end_date, primary_email, primary_phone
   from representatives_core
   where openstates_id = 'ocd-person/...';
   ```

4. **Contacts**
   ```sql
   select contact_type, value, is_primary, source
   from representative_contacts
   where representative_id = (select id from representatives_core where openstates_id = 'ocd-person/...') 
   order by contact_type;
   ```
   Verify that `source = 'openstates_yaml'` and that deduped phone/email entries match the YAML.

5. **Social media**
   ```sql
   select platform, handle, url, is_primary
   from representative_social_media
   where representative_id = ...
   order by platform;
   ```
   Ensure handles align with `ids` / `social_media` array. Only one row per platform should exist.

6. **Photos**
   ```sql
   select url, is_primary, source
   from representative_photos
   where representative_id = ...
   and source = 'openstates_yaml';
   ```

7. **Committees**
   ```sql
   select committee_name, role, is_current
   from representative_committees
   where representative_id = ...
   order by committee_name;
   ```
   Expect entries only for non-legislative roles (task forces, caucuses).

8. **Provenance & quality**
   ```sql
   select source_name, source_type, confidence
   from representative_data_sources
   where representative_id = ...;

   select data_completeness, overall_confidence, validation_method
   from representative_data_quality
   where representative_id = ...;
   ```
   Confirm the OpenStates rows exist and completeness scores align with contact/social presence.

9. **Crosswalk**
   ```sql
   select source_system, source_id, source_confidence
   from representative_crosswalk_enhanced
   where representative_id = ...;
   ```
   Ensure FEC/bioguide identifiers from YAML appear with `source_confidence = 'high'`.

10. **Cleanup (optional)**
    For fixture runs, delete rows by canonical IDs to reset Supabase to baseline or use a transaction with manual rollback.

---

## 4. Automated testing goals

- **Parser unit tests:** validate that `buildCanonicalPerson` preserves target fields (emails, office metadata, roles, identifiers) across sample YAML records.
- **Staging integration tests:** run `stage-openstates.ts` against fixture directory with a mocked Supabase client, asserting the payloads for each staging table.
- **Merge smoke test (mocked Supabase):** simulate the SQL function via pg harness or repository of expected SQL insert/update statements to ensure contract remains consistent.
- **Supabase regression test:** scripted `psql` session (run in CI nightly or before release) that stages fixtures into a disposable schema, runs the merge, and asserts the queries above return expected values.

Track progress for each bullet in `services/civics-backend/ROADMAP.md`.

---

## 5. Schema/type alignment checks

- Keep `docs/DATABASE_SCHEMA.md` updated when merge logic introduces new columns or constraints.
- Regenerate `web/types/supabase.ts` after schema changes and ensure ingest TypeScript references match (e.g., field lengths, nullable vs non-null).
- For every Supabase column touched by the merge function, capture its type/length inside this doc or link to the schema doc for quick reference (e.g., `representatives_core.primary_phone` limited to 20 chars).

---

## 6. Current follow-up items

- [ ] Build fixture set covering: standard legislator, multiple offices, social media variations, legacy identifiers, committee roles.
- [ ] Add automated assertions that `representatives_core.is_active` is always true for OpenStates-ingested rows.
- [ ] Include verification steps in `docs/civics-backend-operations.md` “QA” section once automated tooling ships.
- [ ] Decide whether to store `birth_date`, `biography`, `other_names`, and `division_id` downstream; update this plan once chosen.

Keep this plan updated whenever ingestion logic changes. Lock the checklist before adding new source APIs so we have a consistent baseline to compare against.


