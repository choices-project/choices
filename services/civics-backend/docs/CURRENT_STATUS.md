# Civics Backend Ingest — Current Status

**Last updated:** 2026-01 (ingest refinement pass)

## Summary

The civics backend is an **ingest-only** service that writes representative, activity, elections, and related data into Supabase. All user-facing civics data is served from Supabase; the only external API users touch is **address lookup** (web app `/api/v1/civics/address-lookup`).

## What’s working

- **OpenStates YAML → Supabase:** **Sync** (`openstates:sync-people`) pulls latest from [openstates/people](https://github.com/openstates/people) (git submodule), then stage + merge. Stage (`openstates:stage`) reads YAML from `data/openstates-people/data`, merge (`openstates:merge`) runs `sync_representatives_from_openstates` → `deactivate_non_current_openstates_reps` → `refresh_divisions_from_openstates` → optional activity sync. We use **fresh repo data**, not a static snapshot.
- **Representative activity:** Bills only (`type: 'bill'`). Fetch includes `actions`, `votes`, `sponsorships`; we store sponsorship (primary/cosponsor) and votes when available. See `src/persist/activity.ts`, `npm run tools:audit:activity`, `npm run tools:test:bills`.
- **State-level sync:** Activity, committees, contacts, social, photos, data-sources, voter-registration, Google Civic, Google elections, divisions. See `state:sync:*` scripts.
- **Federal enrich:** Congress IDs, FEC finance. See `federal:enrich:*`. **Ingest order:** OpenStates people first, then FEC. Use `npm run ingest:full` for OpenStates → congress enrich → FEC finance.
- **QA & tooling:** `ingest:qa` runs schema inspect, duplicate report, activity audit, OpenStates coverage, preview. `tools:test:bills` validates bills fetch + sponsorship.
- **Schema & verification:** Supabase MCP checks in `docs/supabase-mcp-verification.md`. Index on `representative_divisions(representative_id)`. **OpenStates ingest verification:** `docs/OPENSTATES_INGEST_VERIFICATION.md` — staging vs merge, current-only filtering, row counts, RPCs, RLS (all verified via Supabase MCP).

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

**Flow:** `openstates:sync-people` (git submodule update from openstates/people) → stage (YAML → staging tables) → merge (sync RPC, deactivate non-current, divisions, optional activity). Logs: `Submodule path ... checked out ...` (sync) → `Upserting openstates_people_data...` → … → `OpenStates staging complete.` → `Running sync_representatives_from_openstates()...` → `Merge completed successfully.` → `Deactivating non-current representatives...` → `Deactivated N non-current representative(s).` → division refresh → optional activity sync. Check process: `pgrep -f stage-openstates` or `pgrep -f run-openstates-merge`. Tail `civics-ingest.log` to monitor.

**Merge "statement timeout":** If merge fails with `canceling statement due to statement timeout`, apply `supabase/migrations/20260126120000_sync_merge_statement_timeout.sql` (increases RPC timeouts), then run `npm run openstates:merge` only. See check-in above.

**Check-in (2026-01-24):** Stage completed successfully (roles → identifiers → other names → social → sources → "OpenStates staging complete"). Merge then ran `sync_representatives_from_openstates()` but **failed with "canceling statement due to statement timeout"**. Postgres was killing the long-running RPC.

**Check-in (2026-01):** Timeout migration applied via MCP. `deactivate_non_current_openstates_reps` migration applied via MCP; merge script runs deactivate after sync. QA (ingest:qa) passed. Ingest restarted in background; tail `civics-ingest.log` to monitor.

**Fix:** Migration `20260126120000_sync_merge_statement_timeout.sql` sets `statement_timeout = '600s'` for `sync_representatives_from_openstates` and `300s` for `refresh_divisions_from_openstates`. **Applied via Supabase MCP `execute_sql` (2026-01).** To re-apply manually: run the migration SQL in Supabase Dashboard → SQL Editor (or `npx supabase db push`), then **re-run only the merge**:

```bash
cd services/civics-backend && npm run openstates:merge
```

Stage is already done; no need to re-run `openstates:stage`. If you use `openstates:ingest`, it runs both stage and merge, so stage would run again too.

---

## Quick reference

| Command | Purpose |
|--------|---------|
| `npm run openstates:sync-people` | Update [openstates/people](https://github.com/openstates/people) submodule from repo (fresh data before stage) |
| `npm run openstates:ingest` | Sync people → stage → merge → deactivate non-current → divisions → optional activity |
| `npm run ingest:full` | OpenStates ingest → congress enrich → FEC finance (full pipeline) |
| `npm run ingest:qa` | Schema, duplicates, activity audit, coverage, preview |
| `npm run tools:audit:activity` | Report/fix non‑bill activity rows |
| `npm run tools:test:bills` | Bills fetch + sponsorship assertion |
| `npm run tools:audit:terms` | Report active reps missing term/next_election |
| `npm run preview` | DB preview (counts + sample from `representatives_core`) |

See `README.md` and `docs/archive/reference/civics/civics-backend-operations.md` for full command catalog.
