# Civics Backend Operations Guide

This guide explains how the rebuilt ingest service is structured, how data flows from civic sources into Supabase, and the exact commands to operate or extend the pipeline. Use it as the runbook when onboarding new contributors or running ingest jobs in production.

## 1. Architecture overview

```
OpenStates YAML ─┐
Supabase staging ─┴─> SQL Merge (`sync_representatives_from_openstates`)
Federal Supabase ─┘           │
                              ├─ representatives_core
                              ├─ representative_contacts / social / photos
                              ├─ representative_data_sources / data_quality
                              └─ representative_campaign_finance (via enrich:finance)
```

- **Stage loader** (`src/scripts/stage-openstates.ts`): parses OpenStates YAML, writes source rows into the `openstates_people_*` tables in bulk.
- **SQL merge function** (`sync_representatives_from_openstates()`): set-based merge that upserts `representatives_core`, contacts, social, photos, provenance, and quality metrics.
- **Legacy persistence utilities** (`src/persist/*.ts`): still available while the SQL pipeline is rolled out; executes replace-by-source writes via REST.
- **CLI scripts** (`src/scripts/*.ts`): orchestration commands with shared argument parsing (`--states`, `--limit`, `--dry-run`).
- **Shared helpers** (`@choices/civics-shared`): reused logic for FEC office codes, district normalization, finance scoring, etc.

## 2. Key workflows

### 2.0 Quick start (operators)

```bash
cd services/civics-backend
cp env.example .env.local          # populate with Supabase + API keys
npm install
npm run ingest:openstates          # stage OpenStates YAML + run SQL merge
npm run ingest:qa                  # schema check, duplicate audit, 5-record preview
```

`ingest:qa` fails fast if the schema drifts, duplicate canonical IDs exist, or the preview script cannot read sample data.

### 2.1 Preview & verification

1. `npm run ingest:openstates` — Stage YAML + execute `sync_representatives_from_openstates()`.
2. `npm run ingest:qa` — Schema inspection, duplicate audit, and a 5-record preview snapshot.
3. `npm run preview -- --states=CA --limit=10` — Optional: inspect a state slice before shipping.
4. Legacy writers (`sync:contacts`, `sync:social`, `sync:photos`, `sync:data-sources`) remain available with `--dry-run` until the SQL-first flow covers every table.
5. `npm run enrich:finance -- --dry-run` — Validate FEC enrichment, then rerun without `--dry-run`.
6. `npm run audit:crosswalk` — Ensure canonical IDs remain healthy; apply `npm run fix:crosswalk` if required.

### 2.2 Data sync commands

| Script | Source fields | Destination table | Replace semantics |
| --- | --- | --- | --- |
| `stage:openstates` | Raw OpenStates YAML | `openstates_people_*` staging tables | Bulk upsert (1000 row chunks); set `OPENSTATES_PEOPLE_DIR` env var |
| `sync:contacts` | Emails, phones, faxes, postal addresses | `representative_contacts` | (Legacy) Delete `source = 'openstates_yaml'` then insert |
| `sync:social` | Twitter, Facebook, Instagram, LinkedIn, YouTube, TikTok | `representative_social_media` | (Legacy) Delete by representative, dedupe per platform |
| `sync:photos` | Primary portrait URL | `representative_photos` | (Legacy) Delete `source = 'openstates_yaml'`, insert canonical portrait |
| `sync:data-sources` | Canonical `sources` list | `representative_data_sources` | Delete existing rows for rep, insert provenance entries |
| `enrich:finance` | FEC totals/top contributors | `representative_campaign_finance` + `representatives_core.data_quality_score` | Writes missing rows by default; supports stale refresh + explicit cycle overrides |

All commands chunk Supabase `.in()` queries (40–50 IDs per request) to avoid Cloudflare 414 responses.

### 2.3 CLI options

- `--states=CA,NY` — Restrict ingest to a comma-separated list of state abbreviations (case-insensitive).
- `--limit=250` — Process at most N records (useful for testing).
- `--dry-run` — No database writes; CLI prints the number of affected representatives.
- `--offset`, `--fec` (finance script only) — Iterate through subsets or target specific FEC IDs.
- `--stale-days=14` (finance) — Revisit representatives whose finance row is ≥14 days old (in addition to brand-new gaps).
- `--include-existing` (finance) — Re-enrich every matching representative regardless of freshness (use sparingly).
- `--cycle=2024` (finance) — Override the inferred even-year FEC cycle.

### 2.4 Error handling & logging

- Supabase errors bubble with clear context (e.g. “Failed to upsert contacts for representative 123: …”).
- FEC rate limits are caught; the script logs a warning and skips the affected representative.
- Missing Supabase IDs result in a skipped representative (no orphan records).
- Crosswalk conflicts retain the canonical IDs already established unless an explicit repair script runs.

### 2.5 Schema inspection

Need to confirm live column lengths or nullability before changing ingest logic?

```
cd services/civics-backend
npm run build --silent && node scripts/inspect-schema.js
```

Requirements:

- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be present in the environment (load `.env.local` first).
- The script calls the SQL function `public.get_table_columns(text)` (added via `supabase/migrations/20251108024500_create_get_table_columns_function.sql`) to read `information_schema.columns`.

Output lists each representative-facing table along with exact types, lengths and nullability so documentation and merges stay aligned with Supabase.

### 2.6 Duplicate canonicals

- `npm run audit:duplicates` — surfaces canonicals with more than one `representatives_core` row (uses `public.get_duplicate_canonical_ids()`).
- `npm run fix:duplicates -- --canonical=<id>` — removes extras for a single canonical. Dry-run by default; pass `--apply` to delete rows.  
  Use `--force` if dependent data exists and you are confident it should be dropped.
- Always rerun `npm run ingest:qa` after any fixes to confirm the dataset is clean.
- Deduplication keeps the representative backed by official sources (`congress_gov_id`, `govinfo_id`, or `congress.gov` provenance) and only falls back to Wikipedia-derived records when no official source exists.

### 2.7 Gap reporting

- `npm run report:gaps` — prints headline counts for:
  - Federal reps with FEC IDs who lack `representative_campaign_finance` rows.
  - Federal reps with recorded `fec:no-data` rows (FEC returned no totals; script will retry once stale).
  - Federal reps missing `congress_gov_id` / `govinfo_id`.
  - State reps missing `primary_phone`.
- Use this output to prioritise enrichment batches (e.g., targeted `--state` runs for `npm run enrich:finance`, or planning OpenStates API calls).
- Run after each enrichment cycle to monitor progress.

### 2.8 Finance auto-update cadence

- **Daily / weekly cron:** `npm run enrich:finance -- --limit=40 --stale-days=7`  
  Processes up to 40 representatives needing finance updates (missing rows first, then stale ones). Increase the throttle window if the FEC API still rate-limits.
- **Zero-impact validation:** Always dry-run first (`--dry-run`) when testing new filters or keys.
- **No-data handling:** When the FEC API returns no totals, the script stores a placeholder row (`sources` contains `fec:no-data`) so subsequent runs skip it until the row becomes stale (controlled by `--stale-days`).
- **Monitoring:** Follow each run with `npm run report:gaps` to confirm the missing-count drops and to review the “Recorded FEC no-data rows” table for manual follow-up.

## 3. Testing & validation

- `npm run lint` — Type-checks the entire ingest service (`tsc --noEmit`).
- `npm run preview -- CA` — Quick sanity check with minimal state slice.
- `npm run sample` — Exercises shared helpers in isolation (no Supabase access required).
- Future work: unit tests under `services/civics-backend/tests/` (see roadmap for planned coverage).

## 4. Extending the pipeline

1. **Add new data sources**  
   - Extend the SQL merge (or create additional staging tables).  
   - Prefer set-based upserts to per-representative REST writes.  
   - Provide CLI helpers to stage new data before running the merge function.

2. **Track provenance & quality**  
   - See `docs/civics-ingest-supabase-plan.md` for remaining tables (`representative_data_sources`, `representative_data_quality`).  
   - When implementing, record the source system, confidence, and run timestamp.

3. **Keep documentation updated**  
   - Link new scripts here and in the README command catalogue.  
   - Log milestones in the utilisation plan so contributors know what’s completed.

## 5. Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Cloudflare 414 “Request-URI Too Large” | Large `.in()` query before chunking | Ensure scripts use chunked fetch helpers (already implemented) |
| “No representatives with Supabase IDs found” | Crosswalk/core table missing IDs for selected states | Run `npm run preview` and verify Supabase `representatives_core` data |
| Finance script aborts with `OVER_RATE_LIMIT` | FEC rate limit reached | Increase `FEC_THROTTLE_MS`, rerun with `--limit` batches |
| Contacts/social duplicates | Multiple runs without source purge | Scripts already delete `openstates_yaml` rows; verify Supabase triggers or manual inserts aren’t reintroducing duplicates |

## 6. Related resources

- `docs/civics-ingest-supabase-plan.md` — Status per Supabase table.
- `docs/product-quality-roadmap.md` — Platform-wide remediation priorities.
- `services/civics-backend/src/ingest/openstates/people.ts` — Canonical type definitions for civic data.

Keep this runbook current as new data sources, scripts, or operational procedures are introduced.

