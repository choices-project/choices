# Civics Backend Ingest

Standalone TypeScript service that rebuilds and synchronises civic representative data.  
The package is designed to be reusable outside the Choices web app: point it at your Supabase project and civic API keys and you obtain a fully normalised, auditable dataset.

## Directory layout

- `src/` – source TypeScript (ingest pipeline, Supabase writers, CLI utilities).
- `src/run-sample.ts` – lightweight script demonstrating the shared helpers without credentials.
- `build/` – emitted JavaScript after `npm run build`.
- `../civics-shared/` – shared helpers consumed by both the backend ingest and the web orchestrator.

## Environment prerequisites

Copy `env.example` to `.env.local` and fill in the values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- API keys as needed (`FEC_API_KEY`, `OPENSTATES_API_KEY`, `GOOGLE_CIVIC_API_KEY`, etc.)

> Never commit `.env.local`. The CLI automatically loads it via `dotenv`.

### Quick start (CLI happy path)

```bash
cd services/civics-backend
cp env.example .env.local               # edit with your Supabase + API keys
npm install
npm run ingest:openstates               # stage OpenStates YAML + run SQL merge
npm run ingest:qa                       # schema check, duplicate audit, 5-record preview
```

If `ingest:qa` exits non-zero, follow the printed instructions (usually `npm run audit:duplicates` or `npm run fix:duplicates`).

## Install & build

```bash
cd services/civics-backend
npm install
npm run build        # transpiles src → build
npm run lint         # type-checks (tsc --noEmit)
npm run sample       # optional: exercises shared helpers without Supabase
```

## Command catalogue

| Command | Purpose | Notes |
| --- | --- | --- |
| `npm run ingest:openstates` | Convenience wrapper for `stage:openstates` → `merge:openstates` | Requires `.env.local` and local OpenStates YAML |
| `npm run ingest:qa` | One-stop verification (schema inspection, duplicate audit, 5-rep preview) | Fails the run if issues are detected |
| `npm run preview [-- STATE]` | Preview canonical reps without writing | Accepts `--limit`/`--states`; ideal for spot checks |
| `npm run inspect:schema` | Print live Supabase column types/lengths | Uses `public.get_table_columns(text)` |
| `npm run audit:duplicates` | List duplicate `representatives_core` canonicals | Exits non-zero if duplicates exist |
| `npm run fix:duplicates -- [--canonical=ID] [--apply] [--force]` | Remove duplicate canonicals safely | Moves crosswalk links; dry-run by default |
| `npm run report:gaps` | Summarize enrichment gaps (FEC, Congress.gov, state contacts) | Prints counts and sample rows to prioritise API usage |
| `npm run stage:openstates` | Load OpenStates YAML into Supabase staging tables | `OPENSTATES_PEOPLE_DIR` can override the default directory |
| `npm run merge:openstates` | Execute the SQL merge function | Calls `sync_representatives_from_openstates()` |
| `npm run prioritize` | List lowest-quality representatives | Orders by Supabase `data_quality_score` to target enrichment |
| `npm run sync:contacts` / `social` / `photos` / `data-sources` | Legacy REST writers (being replaced by SQL merge) | Still available until SQL-first flow covers all cases |
| `npm run enrich:finance` | Pull FEC totals & persist finance rollups | Default run targets reps missing finance rows; supports stale rechecks and cycle overrides |
| `npm run audit:crosswalk` | Audit Supabase canonical ID crosswalk | Flags mismatches or missing IDs |
| `npm run fix:crosswalk` | Repair corrupted canonical IDs | Deterministically reassigns IDs then re-runs audit |

All sync/enrich commands support:

- `--states=CA,NY` – filter to specific states (case-insensitive).
- `--limit=250` – cap records processed (where applicable).
- `--dry-run` – execute without writing to Supabase (reports counts only).

Finance-specific flags:

- `--stale-days=14` – reprocess rows whose finance record was last updated ≥14 days ago (still includes brand-new gaps).
- `--include-existing` – bypass the missing/stale filter and refresh every match (use sparingly; honours throttling but hits the API hard).
- `--cycle=2024` – override the inferred FEC cycle (defaults to the current even year).

The finance script records explicit “no-data” rows when the FEC API returns nothing. These rows carry `sources=['fec:no-data', 'fec:<cycle>']` and are surfaced by `npm run report:gaps`, ensuring we avoid re-requesting them until the row becomes stale.

## Operational workflow (SQL-first)

1. `npm run ingest:openstates` – Stage the YAML and run the SQL merge.
2. `npm run ingest:qa` – Schema inspection, duplicate audit, and a 5-record preview snapshot.
3. If duplicates are reported:
   - `npm run fix:duplicates -- --canonical=<id>` to clean one canonical, or  
   - `npm run fix:duplicates -- --apply` to process all duplicate sets (skips rows with dependent data unless `--force` is supplied).
4. Optional enrichments (FEC, contacts/social/photos) remain available while the SQL-first pipeline fully replaces the legacy writers.
5. Commit migrations/docs updates when schema changes occur (`supabase/migrations/*.sql`, `docs/DATABASE_SCHEMA.md`, `docs/civics-backend-operations.md`).

Each sync script uses replace-by-source semantics: prior rows inserted with `source = 'openstates_yaml'` are deleted before new data is written, ensuring idempotent reruns with no duplication.

## Quality gates & data guarantees

- **`npm run ingest:qa`** codifies the minimum QA checklist: schema alignment, duplicate detection, and preview output.
- **Chunked Supabase queries** prevent Cloudflare 414 errors when querying large ID lists.
- **Supabase ID required** — records without a `representatives_core.id` are skipped to avoid orphan rows.
- **Deterministic ordering** — first entry per platform/contact becomes `is_primary`, ensuring stable diffs.
- **Dry runs evolve into live runs** — every legacy sync/enrich command accepts `--dry-run`.
- **Strict typing** — `npm run lint` (tsc --noEmit) enforces compile-time guarantees across the ingest codebase.

## Duplicate resolution toolkit

- `npm run audit:duplicates` — surfaces canonicals with more than one `representatives_core` row (uses the `public.get_duplicate_canonical_ids()` SQL helper).
- `npm run fix:duplicates -- --canonical=fec:H4CA27111` — deletes extra rows for a single canonical (dry-run by default).
- `npm run fix:duplicates -- --apply` — sweep all duplicates; the script migrates crosswalk entries and skips rows with dependent data unless `--force` is provided.
- Logs show what will be deleted; nothing is removed until `--apply` is passed.
- Deduplication always keeps the representative backed by official sources (`congress_gov_id`, `govinfo_id`, or `congress.gov` provenance) and only falls back to Wikipedia-derived rows when no official record exists.

## Additional documentation

- `docs/civics-backend-operations.md` – architecture, runbook, quick start, and QA guidance.
- `docs/civics-ingest-checklist.md` – printable checklist for each data load (pre-ingest, ingest, post-ingest).
- `docs/civics-ingest-supabase-plan.md` – table-by-table roadmap for remaining Supabase integrations.
- `docs/product-quality-roadmap.md` – broader platform remediation priorities.
- `services/civics-backend/env.example` – reference environment file for new contributors.

Keep these resources updated when new scripts land or data contracts evolve so downstream teams can trust and reuse the ingest pipeline.
