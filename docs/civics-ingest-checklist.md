# Civics Ingest Checklist

Print or duplicate this checklist when running the civics ingest service. Tick every box before marking a data load complete.

## Pre-ingest
- [ ] Update `services/civics-backend/.env.local` (or copy `env.example`) with the correct Supabase URL/service-role key and API tokens.
- [ ] Sync the latest OpenStates People YAML to `services/civics-backend/data/openstates-people/data` (or set `OPENSTATES_PEOPLE_DIR`).
- [ ] `npm install` and `npm run lint` succeed locally.
- [ ] Supabase migrations are up to date (run `supabase db push` or apply via the dashboard if needed).

## Ingest
- [ ] `npm run ingest:openstates` completes without errors.
- [ ] `npm run ingest:qa` completes successfully (schema aligned, no duplicate canonicals, preview returns data).
- [ ] If `ingest:qa` fails, resolve the issue (`npm run inspect:schema`, `npm run audit:duplicates`, `npm run fix:duplicates`, etc.) and rerun `ingest:qa` until it passes.

## Optional enrichments (run as required)
- [ ] `npm run enrich:finance -- --dry-run` (review output) then rerun without `--dry-run`.
- [ ] `npm run sync:contacts/social/photos/data-sources -- --dry-run` (if legacy REST writers are still in use) before running live.
- [ ] `npm run audit:crosswalk` passes after any manual adjustments.

## Post-ingest
- [ ] Spot-check a handful of representatives (`npm run preview -- --states=CA --limit=5`).
- [ ] Commit Supabase migrations and documentation updates (`docs/DATABASE_SCHEMA.md`, `docs/civics-backend-operations.md`) if anything changed.
- [ ] Archive/commit ingest notes so future runs know what changed.

## Reference commands
- Full run: `npm run ingest:openstates && npm run ingest:qa`
- Schema inspection: `npm run inspect:schema`
- Duplicate audit: `npm run audit:duplicates`
- Duplicate fix: `npm run fix:duplicates -- --canonical=<ID> --apply`
- Preview slice: `npm run preview -- --states=CA --limit=10`

