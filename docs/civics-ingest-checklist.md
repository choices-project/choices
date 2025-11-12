# Civics Ingest Checklist

Print or duplicate this checklist when running the civics ingest service. Tick every box before marking a data load complete.  
Need more context? Start with [`docs/civics-backend-quickstart.md`](./civics-backend-quickstart.md).

## Pre-ingest
- [ ] Update `services/civics-backend/.env.local` (or copy `env.example`) with the correct Supabase URL/service-role key and API tokens.
- [ ] Sync the latest OpenStates People YAML to `services/civics-backend/data/openstates-people/data` (or set `OPENSTATES_PEOPLE_DIR`).
- [ ] `npm install` and `npm run lint` succeed locally.
- [ ] Supabase migrations are up to date (run `supabase db push` or apply via the dashboard if needed).

## Ingest
- [ ] `npm run openstates:ingest` completes without errors.
- [ ] `npm run ingest:qa` completes successfully (schema aligned, no duplicate canonicals, preview returns data).
- [ ] If `ingest:qa` fails, resolve the issue (`npm run tools:inspect:schema`, `npm run tools:report:duplicates`, `npm run tools:fix:duplicates`, etc.) and rerun `ingest:qa` until it passes.

## Optional enrichments (run as required)
- [ ] `npm run federal:enrich:finance -- --dry-run` (review output) then rerun without `--dry-run`.
- [ ] `npm run federal:enrich:congress -- --dry-run` (fill missing Congress.gov / GovInfo IDs) before running live.
- [ ] `npm run state:sync:contacts/social/photos/data-sources -- --dry-run` (if legacy REST writers are still in use) before running live.
- [ ] `npm run state:sync:committees -- --dry-run` (if committee assignments need refreshing) before running live.
- [ ] `npm run state:sync:activity -- --dry-run` (if OpenStates bill activity needs refreshing) before running live.
- [ ] `npm run state:refresh -- --states=CA --dry-run` (optional shortcut; honours `--only` / `--skip`).
- [ ] `npm run tools:audit:crosswalk` passes after any manual adjustments.

## Post-ingest
- [ ] Spot-check a handful of representatives (`npm run preview -- --states=CA --limit=5`).
- [ ] Commit Supabase migrations and documentation updates (`docs/DATABASE_SCHEMA.md`, `docs/civics-backend-operations.md`) if anything changed.
- [ ] Archive/commit ingest notes so future runs know what changed.

## Reference commands
- Full run: `npm run openstates:ingest && npm run ingest:qa`
- Schema inspection: `npm run tools:inspect:schema`
- Duplicate audit: `npm run tools:report:duplicates`
- Duplicate fix: `npm run tools:fix:duplicates -- --canonical=<ID> --apply`
- Preview slice: `npm run preview -- --states=CA --limit=10`

