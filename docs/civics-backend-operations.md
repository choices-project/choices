# Civics Backend Operations Guide

This guide explains how the rebuilt ingest service is structured, how data flows from civic sources into Supabase, and the exact commands to operate or extend the pipeline. Use it as the runbook when onboarding new contributors or running ingest jobs in production.

## 1. Architecture overview

```
OpenStates YAML ─┐
Supabase core ───┼─> CanonicalRepresentative (merge layer)
ID crosswalk  ───┘
                           ┌─ sync:contacts  -> representative_contacts
CanonicalRepresentative ───┤─ sync:social    -> representative_social_media
                           ├─ sync:photos    -> representative_photos
                           └─ enrich:finance -> representative_campaign_finance
```

- **Canonical builder** (`src/ingest/openstates/people.ts`): streams OpenStates people YAML, filters to active representatives, and produces strongly typed `CanonicalRepresentative` records (IDs, contact info, offices, social profiles, photos).
- **Supabase merge layer** (`src/ingest/supabase/representatives.ts`): fetches existing Supabase rows in deterministic chunks, applies canonical ID crosswalks, merges official contact/social/photo details, and assigns `supabaseRepresentativeId`.
- **Persistence utilities** (`src/persist/*.ts`): idempotent writers that purge previous `openstates_yaml` rows before inserting deduplicated data.
- **CLI scripts** (`src/scripts/*.ts`): orchestration commands with shared argument parsing (`--states`, `--limit`, `--dry-run`).
- **Shared helpers** (`@choices/civics-shared`): reused logic for FEC office codes, district normalization, finance scoring, etc.

## 2. Key workflows

### 2.1 Preview & verification

1. `npm run preview` — Inspect canonical reps (no writes).
2. `npm run sync:contacts -- --dry-run` — Confirm counts.
3. Repeat for `sync:social` and `sync:photos`.
4. `npm run enrich:finance -- --dry-run` — Spot-check finance payloads.
5. `npm run audit:crosswalk` — Ensure canonical IDs remain healthy.

Remove `--dry-run` once satisfied with the output.

### 2.2 Data sync commands

| Script | Source fields | Destination table | Replace semantics |
| --- | --- | --- | --- |
| `sync:contacts` | Emails, phones, faxes, postal addresses | `representative_contacts` | Delete `source = 'openstates_yaml'` then insert |
| `sync:social` | Twitter, Facebook, Instagram, LinkedIn, YouTube, TikTok | `representative_social_media` | Delete by representative, dedupe per platform |
| `sync:photos` | Primary portrait URL | `representative_photos` | Delete `source = 'openstates_yaml'`, insert canonical portrait |
| `sync:data-sources` | Canonical `sources` list | `representative_data_sources` | Delete existing rows for rep, insert provenance entries |
| `enrich:finance` | FEC totals/top contributors | `representative_campaign_finance` + `representatives_core.data_quality_score` | Upsert on `representative_id`; throttled for rate limits |

All commands chunk Supabase `.in()` queries (40–50 IDs per request) to avoid Cloudflare 414 responses.

### 2.3 CLI options

- `--states=CA,NY` — Restrict ingest to a comma-separated list of state abbreviations (case-insensitive).
- `--limit=250` — Process at most N records (useful for testing).
- `--dry-run` — No database writes; CLI prints the number of affected representatives.
- `--offset`, `--fec` (finance script only) — Iterate through subsets or target specific FEC IDs.

### 2.4 Error handling & logging

- Supabase errors bubble with clear context (e.g. “Failed to upsert contacts for representative 123: …”).
- FEC rate limits are caught; the script logs a warning and skips the affected representative.
- Missing Supabase IDs result in a skipped representative (no orphan records).
- Crosswalk conflicts retain the canonical IDs already established unless an explicit repair script runs.

## 3. Testing & validation

- `npm run lint` — Type-checks the entire ingest service (`tsc --noEmit`).
- `npm run preview -- CA` — Quick sanity check with minimal state slice.
- `npm run sample` — Exercises shared helpers in isolation (no Supabase access required).
- Future work: unit tests under `services/civics-backend/tests/` (see roadmap for planned coverage).

## 4. Extending the pipeline

1. **Add new data sources**  
   - Create a persistence utility under `src/persist/`.  
   - Follow the replace-by-source pattern (delete existing rows before inserting).  
   - Add a CLI wrapper under `src/scripts/` and register it in `package.json`.

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

