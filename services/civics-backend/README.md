# Civics Backend Ingest

The Civics Backend is a **standalone ingest-only service** that keeps Supabase stocked with accurate representative data (contacts, committees, bill activity, elections, finance) sourced from OpenStates, FEC, and Google Civic. It writes into Supabase; it does **not** serve users. All user-facing civics data comes from Supabase. The only external API users touch is **address lookup** (handled by the web app’s `/api/v1/civics/address-lookup` endpoint).

You do not need to touch the web app to operate the ingest—just load the environment file, run the provided scripts, and verify the results.

**New developer?** Start with **[`NEW_civics_ingest/docs/GETTING_STARTED.md`](./NEW_civics_ingest/docs/GETTING_STARTED.md)** — 3 steps: `npm run ingest:setup` then `npm run ingest`. The remainder of this README gives additional detail for operators who want to understand how pieces fit together.

---

## 1. Who should use this?
- Anyone tasked with refreshing civic representative data on a regular cadence.
- Civic partners who want a reusable ingest pipeline for their own Supabase project.
- Engineers extending the ingest scripts with new sources or QA checks.

---

## 2. Setup at a glance
1. Run `npm run ingest:setup` (creates `.env` from `env.example` if missing) or use existing `.env` / `.env.local` / `web/.env.local`. Provide:
   - `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENSTATES_API_KEY`, `FEC_API_KEY`, and any other API keys you have access to.
   - Optional tuning:
     - `OPENSTATES_ACTIVITY_LIMIT` (default `8`) – number of recent bills captured per representative.
     - `SKIP_ACTIVITY_SYNC=1` – skip the automatic bill-activity sync when running `npm run ingest:openstates`.
2. Install dependencies inside `services/civics-backend/`:
   ```bash
   npm install
   ```
3. Confirm the OpenStates people submodule exists: `data/openstates-people` points at [openstates/people](https://github.com/openstates/people). Before each ingest, `openstates:sync-people` runs `git submodule update --remote` so we use **fresh repo data**, not a static snapshot. You can set `OPENSTATES_PEOPLE_DIR` to a custom path to override.

> **Remember:** keep `.env` out of version control. Scripts load from `.env`, `.env.local`, or `web/.env.local` via `loadEnv()`.

---

## 3. Everyday operations (core commands)
**Simplest path (one command):**

```bash
cd services/civics-backend
npm run ingest   # Full pipeline: baseline → committees/activity → federal enrichment
npm run ingest -- --dry-run   # Preview steps without executing
```

**Step-by-step:**

```bash
npm run ingest:openstates   # merge OpenStates data + auto-sync bill activity
npm run ingest:qa          # report gaps, smoke test, metrics dashboard
```

**Daily re-ingest (rate-limit aware):** `npm run reingest:scheduled`

When needed:
- `npm run ingest -- --dry-run` – preview full pipeline without executing.
- `npm run federal:enrich:finance -- --dry-run` – confirm FEC updates, then drop `--dry-run`.
- `npm run federal:enrich:congress -- --dry-run` – fill missing Congress.gov & GovInfo IDs (dry-run logs changes without persisting).
- `npm run openstates:sync:committees` – refresh committee assignments.
- `npm run openstates:sync:activity -- --resume` – replay bill activity if you skipped the automatic step or need a narrow refresh.

All commands accept `--states`, `--limit`, and `--dry-run` for safe testing. Finance-specific scripts also support `--stale-days`, `--include-existing`, and `--cycle`.

---

## 4. What happens under the hood
- **Ingest-only.** This service fetches from external APIs (OpenStates, FEC, Google Civic) and **writes** into Supabase. The web app serves users **only** from Supabase (and from the address-lookup endpoint, which is the sole user-facing external API).
- **Sync** (`openstates:sync-people`) updates the [openstates/people](https://github.com/openstates/people) submodule from the repo so we use fresh YAML, not old procured data.
- **Stage loader** (`NEW_civics_ingest/openstates/stage-openstates.ts`) ingests the raw YAML into staging tables.
- **SQL merge** (`sync_representatives_from_openstates`) updates `representatives_core`; then `deactivate_non_current_openstates_reps` marks reps no longer current as inactive; `refresh_divisions_from_openstates` rebuilds divisions.
- **Post-merge activity sync** replays OpenStates bill data into `representative_activity` (unless you set `SKIP_ACTIVITY_SYNC`).
- **Federal enrichers** (`NEW_civics_ingest/federal/*`) hydrate Congress.gov IDs and FEC data separately from the YAML ingest.
- **State refreshers** (`state:sync:contacts` / `social` / `photos` / `committees` / `activity` / `data-sources` / `google-civic` / `google-elections`) remain available for surgical reruns while we continue expanding the SQL-first flow.
- **Shared helpers** live in `@choices/civics-shared` so the ingest service and web app stay in lockstep.

The `NEW_civics_ingest/` directory is organised around the ingest lifecycle:
- `openstates/` – people YAML staging and SQL merge orchestration.
- `federal/` – enrichment passes for Congress.gov, GovInfo, and FEC.
- `openstates/` (sync-*.ts) – OpenStates API-driven committees, activity, events.
- `scripts/tools/` – diagnostics, repair tools, and reporting utilities (duplicates, schema introspection, coverage gaps).

Each writer uses replace-by-source semantics: rows inserted with `source = 'openstates_yaml'` are deleted before new data is written, ensuring idempotent reruns.

---

## 5. Command reference (extended)

| Command | Purpose (plain language) | Good to know |
| --- | --- | --- |
| `npm run ingest:setup` | Create `.env` from `env.example` (if missing) and run pre-flight check | Run first time; then edit `.env` with your keys |
| `npm run ingest:check` | Verify `.env`, required vars, optional API keys | Run before `ingest` to catch config issues |
| `npm run ingest` | Full pipeline: baseline → committees/activity → federal enrichment | One command; skips steps when API keys missing |
| `npm run gap:fill` | **Standalone gap-fill** — identifies gaps, fills them, backs off at rate limits | Use `--dry-run` to preview; `--skip-openstates` / `--skip-federal` |
| `npm run reingest:scheduled` | Rate-limit-aware committees + activity sync (for daily cron) | Respects OpenStates limit (default 250/day); uses `--resume` |
| `npm run openstates:sync-people` | Update [openstates/people](https://github.com/openstates/people) submodule from repo (`git submodule update --remote`) | Run automatically before stage; use fresh repo data, not old procured data |
| `npm run openstates:ingest` | Sync people repo → stage YAML → merge → deactivate non-current → divisions → optional bill activity | Runs `openstates:sync-people` first |
| `npm run ingest:qa` | Run QA: report gaps, smoke test, metrics dashboard | Fails fast with actionable guidance |
| `npm run federal:enrich:finance` | Fetch FEC totals & contributors and update Supabase rows | Records “no data” placeholders when FEC has nothing |
| `npm run federal:enrich:congress` | Hydrate missing bioguide, Congress.gov, and GovInfo IDs | Honors `--dry-run` for change previews |
| `npm run openstates:sync:committees` | Rebuild committee memberships from OpenStates API | Use `--resume` to continue from checkpoint |
| `npm run openstates:sync:activity` | Rebuild bill activity (only needed if you skipped the auto-sync) | Honors `OPENSTATES_ACTIVITY_LIMIT`; use `--resume` |
| `npm run tools:report:gaps` | Show remaining finance, congress, activity, committee gaps | Helps prioritise follow-up runs |
| `npm run tools:smoke-test` | Data integrity check (counts, quality, identifiers, constraints) | Requires live Supabase |
| `npm run tools:metrics:dashboard` | Coverage, quality, API usage | |
| `npm run tools:audit:duplicates` | Find duplicate canonicals | |
| `npm run tools:verify:crosswalk` | Verify identifier mapping | |
| `npm run state:sync:social` / `npm run state:sync:contacts` / `npm run state:sync:photos` | Rebuild targeted tables from OpenStates YAML | Support `--dry-run`, `--states`, `--limit` |

For the full list—including `openstates:stage`, `openstates:merge`, and development helpers—inspect `package.json` or the **Operations Guide** linked below.

---

## 6. Quality guarantees & troubleshooting
- **QA is mandatory.** If `npm run ingest:qa` fails, follow the instructions it prints or consult [OPERATOR_RUNBOOK.md](NEW_civics_ingest/docs/OPERATOR_RUNBOOK.md) § Troubleshooting.
- **Dry-runs are your friend.** Every legacy sync/enrich command honors `--dry-run` for safe previews.
- **Chunked Supabase queries** are built-in; large `.in()` calls won’t overflow URLs.
- **Bill activity metrics** (`processed/total/failed`) appear after each merge so you can confirm OpenStates API calls succeeded.
- **Rate limits?** Finance and OpenStates clients log warnings; wait a minute or rerun with a smaller `--limit`.

---

## 7. Further reading
- [`NEW_civics_ingest/docs/GETTING_STARTED.md`](./NEW_civics_ingest/docs/GETTING_STARTED.md) – 3-step quick start for new developers.
- [`NEW_civics_ingest/docs/README.md`](./NEW_civics_ingest/docs/README.md) – Ingest docs index.
- [`NEW_civics_ingest/docs/OPERATOR_RUNBOOK.md`](./NEW_civics_ingest/docs/OPERATOR_RUNBOOK.md) – Operations, troubleshooting, recovery, security.
- [`env.example`](./env.example) – reference environment file (copy to `.env`; scripts load via `loadEnv()`).

**Archived (historical reference):** `docs/archive/reference/civics/` – older operations guides, checklists, and roadmaps. Use the docs above for current guidance.

Keep these resources updated whenever scripts gain new features or data contracts change—clarity for the next operator is part of the deliverable.

