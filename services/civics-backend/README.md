# Civics Backend Ingest

Standalone TypeScript service that rebuilds and synchronises civic representative data.  
The package is designed to be reusable outside the Choices web app: point it at your Supabase project and civic API keys and you obtain a fully normalised, auditable dataset.

## Directory layout

- `src/` – source TypeScript (ingest pipeline, Supabase writers, CLI utilities).
- `src/run-sample.ts` – lightweight script demonstrating the shared helpers without credentials.
- `build/` – emitted JavaScript after `npm run build`.
- `../civics-shared/` – shared helpers consumed by both the backend ingest and the web orchestrator.

## Environment prerequisites

Create `services/civics-backend/.env.local` with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- API keys as needed (`FEC_API_KEY`, `OPENSTATES_API_KEY`, `GOOGLE_CIVIC_API_KEY`, etc.)

> Never commit `.env.local`. The CLI automatically loads it via `dotenv`.

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
| `npm run prioritize` | List lowest-quality representatives | Orders by Supabase `data_quality_score` to target enrichment |
| `npm run preview [-- STATE]` | Preview canonical reps without writing | Merges OpenStates YAML + Supabase + crosswalk for inspection |
| `npm run sync:contacts [--options]` | Upsert `representative_contacts` | Replaces prior `openstates_yaml` rows with deduped emails/phones/faxes/addresses |
| `npm run sync:social [--options]` | Upsert `representative_social_media` | Normalises handles/URLs from YAML + Supabase primaries |
| `npm run sync:photos [--options]` | Upsert `representative_photos` | Maintains canonical portrait with `is_primary` flag |
| `npm run sync:data-sources [--options]` | Upsert `representative_data_sources` | Records provenance for each upstream source feeding the representative |
| `npm run enrich:finance [--options]` | Pull FEC totals & persist finance rollups | Writes to `representative_campaign_finance` and bumps `data_quality_score` |
| `npm run audit:crosswalk` | Audit Supabase canonical ID crosswalk | Flags duplicates/mismatches before writing |
| `npm run fix:crosswalk` | Repair corrupted canonical IDs | Deterministically reassigns IDs then re-runs audit |

All sync/enrich commands support:

- `--states=CA,NY` – filter to specific states (case-insensitive).
- `--limit=250` – cap records processed (where applicable).
- `--dry-run` – execute without writing to Supabase (reports counts only).

## Operational workflow

1. **Preview** — `npm run preview -- CA` to sample upcoming changes.  
2. **Contacts** — `npm run sync:contacts -- --dry-run` then rerun without the flag to persist.  
3. **Social** — `npm run sync:social -- --dry-run` followed by a live run.  
4. **Photos** — `npm run sync:photos -- --dry-run` to confirm portraits before persisting.  
5. **Provenance** — `npm run sync:data-sources -- --dry-run` to audit source coverage.  
6. **Finance** — `npm run enrich:finance -- --dry-run` for a spot-check, then execute live.  
7. **Audit** — `npm run audit:crosswalk` to verify canonical IDs, applying `npm run fix:crosswalk` if required.

Each sync script uses replace-by-source semantics: prior rows inserted with `source = 'openstates_yaml'` are deleted before new data is written, ensuring idempotent reruns with no duplication.

## Resiliency & data guarantees

- **Chunked Supabase queries** prevent Cloudflare 414 errors when querying large ID lists.  
- **Supabase ID required** — records without a `representatives_core.id` are skipped to avoid orphan rows.  
- **Deterministic ordering** — first entry per platform/contact becomes `is_primary`, ensuring stable diffs.  
- **Dry runs** are cheap: every CLI accepts `--dry-run` and reports the number of rows it would upsert.  
- **Strict typing** — `npm run lint` enforces TypeScript safety across ingest modules and writers.

## Additional documentation

- `docs/civics-backend-operations.md` – architecture, data flow, and runbook for this service.
- `docs/civics-ingest-supabase-plan.md` – table-by-table roadmap for remaining Supabase integrations.
- `docs/product-quality-roadmap.md` – broader platform remediation priorities.

Keep these resources updated when new scripts land or data contracts evolve so downstream teams can trust and reuse the ingest pipeline.