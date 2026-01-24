# Civics Backend Ingest — Current Status

**Last updated:** 2026-01 (ingest refinement pass)

## Summary

The civics backend is an **ingest-only** service that writes representative, activity, elections, and related data into Supabase. All user-facing civics data is served from Supabase; the only external API users touch is **address lookup** (web app `/api/v1/civics/address-lookup`).

## What’s working

- **OpenStates YAML → Supabase:** Stage (`openstates:stage`) + merge (`openstates:merge`); `representatives_core`, `representative_divisions`, crosswalk, etc.
- **Representative activity:** Bills only (`type: 'bill'`). Fetch includes `actions`, `votes`, `sponsorships`; we store sponsorship (primary/cosponsor) and votes when available. See `src/persist/activity.ts`, `npm run tools:audit:activity`, `npm run tools:test:bills`.
- **State-level sync:** Activity, committees, contacts, social, photos, data-sources, voter-registration, Google Civic, Google elections, divisions. See `state:sync:*` scripts.
- **Federal enrich:** Congress IDs, FEC finance. See `federal:enrich:*`.
- **QA & tooling:** `ingest:qa` runs schema inspect, duplicate report, activity audit, OpenStates coverage, preview. `tools:test:bills` validates bills fetch + sponsorship.
- **Schema & verification:** Supabase MCP checks documented in `docs/supabase-mcp-verification.md`. Index on `representative_divisions(representative_id)`.

## Backlog / TODO

- **Term / next_election:** `term_start_date` and `term_end_date` come from OpenStates roles; `next_election_date` is **not** set by the merge. Populate via state/federal enrich or derive from `term_end_date`. Use `npm run tools:audit:terms` to report active reps missing these.
- **Validation harness:** Staging/merge fixtures (mock Supabase), CLI smoke-test template for live Supabase.
- **Crosswalk + dedupe:** Automated duplicate auditing + quality scoring updates; see `tools:report:duplicates`, `tools:fix:duplicates`.
- **API call optimisation:** Encode throttling / filter logic from `ingestion-flow-strategy.md` in enrichers and CLI.
- **Regenerate Supabase types** after next schema change: `npx supabase gen types typescript …`.
- **CURRENT_STATUS roll-up:** Keep this doc updated as backlog items are closed. Archive legacy scripts once SQL-first replacements are ubiquitous.

## Monitoring a running ingest

When `npm run openstates:ingest` (or `state:sync:*`) is run in the background, monitor progress by tailing the log:

```bash
tail -f services/civics-backend/civics-ingest.log
```

Stage logs: `Upserting openstates_people_data...` → `Mapped N IDs...` → `Syncing contacts...` → … → `OpenStates staging complete.` Then merge: `Running sync_representatives_from_openstates()...` → `Merge completed successfully.` Optional: `Syncing OpenStates bill activity...` (unless `SKIP_ACTIVITY_SYNC=1`). Check that the process is running: `pgrep -f stage-openstates` or `pgrep -f run-openstates-merge`.

---

## Quick reference

| Command | Purpose |
|--------|---------|
| `npm run ingest:qa` | Schema, duplicates, activity audit, coverage, preview |
| `npm run tools:audit:activity` | Report/fix non‑bill activity rows |
| `npm run tools:test:bills` | Bills fetch + sponsorship assertion |
| `npm run tools:audit:terms` | Report active reps missing term/next_election |
| `npm run preview` | DB preview (counts + sample from `representatives_core`) |

See `README.md` and `docs/archive/reference/civics/civics-backend-operations.md` for full command catalog.
