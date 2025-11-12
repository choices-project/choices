# Civics Backend Ingest

The Civics Backend is a standalone service that keeps Supabase stocked with accurate representative data (contacts, committees, bill activity, finance) sourced from OpenStates and the FEC. You do not need to touch the web app to operate it—just load the environment file, run the provided scripts, and verify the results.

If you are new to the project or prefer a checklist-style walk-through, start with **[`docs/civics-backend-quickstart.md`](../../docs/civics-backend-quickstart.md)**. The remainder of this README gives additional detail for operators who want to understand how pieces fit together.

---

## 1. Who should use this?
- Anyone tasked with refreshing civic representative data on a regular cadence.
- Civic partners who want a reusable ingest pipeline for their own Supabase project.
- Engineers extending the ingest scripts with new sources or QA checks.

---

## 2. Setup at a glance
1. Copy `env.example` to `.env.local` and provide:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENSTATES_API_KEY`, `FEC_API_KEY`, and any other API keys you have access to.
   - Optional tuning:
     - `OPENSTATES_ACTIVITY_LIMIT` (default `8`) – number of recent bills captured per representative.
     - `SKIP_ACTIVITY_SYNC=1` – skip the automatic bill-activity sync when running `npm run ingest:openstates`.
2. Install dependencies inside `services/civics-backend/`:
   ```bash
   npm install
   ```
3. Confirm OpenStates YAML files exist under `data/openstates-people/data` (or set `OPENSTATES_PEOPLE_DIR` to a custom path).

> **Remember:** keep `.env.local` out of version control. The CLI automatically loads it via `dotenv`.

---

## 3. Everyday operations (core commands)
The fastest path is the same trio highlighted in the quickstart:

```bash
cd services/civics-backend
npm run ingest:openstates   # merge OpenStates data + auto-sync bill activity
npm run ingest:qa           # schema check, duplicate audit, 5-record preview
```

When needed:
- `npm run preview -- --states=CA --limit=5` – sanity check specific states.
- `npm run federal:enrich:finance -- --dry-run` – confirm FEC updates, then drop `--dry-run`.
- `npm run federal:enrich:congress -- --dry-run` – fill missing Congress.gov & GovInfo IDs (dry-run logs changes without persisting).
- `npm run state:refresh -- --states=CA --dry-run` – run the entire OpenStates API refresh stack in order.
- `npm run state:sync:committees` – refresh committee assignments (the merge already writes the default OpenStates snapshot).
- `npm run state:sync:activity` – replay bill activity if you skipped the automatic step or need a narrow refresh.

All commands accept `--states`, `--limit`, and `--dry-run` for safe testing. Finance-specific scripts also support `--stale-days`, `--include-existing`, and `--cycle`.

---

## 4. What happens under the hood
- **Stage loader** (`src/scripts/openstates/stage-openstates.ts`) ingests the raw YAML into staging tables.
- **SQL merge** (`sync_representatives_from_openstates`) updates `representatives_core` plus contacts, social, photos, provenance, and quality metrics.
- **Post-merge activity sync** replays OpenStates bill data into `representative_activity` (unless you set `SKIP_ACTIVITY_SYNC`).
- **Federal enrichers** (`src/scripts/federal/*`) hydrate Congress.gov IDs and FEC data separately from the YAML ingest.
- **State refreshers** (`state:sync:contacts` / `social` / `photos` / `committees` / `activity` / `data-sources` / `google-civic`) remain available for surgical reruns while we continue expanding the SQL-first flow.
- **Shared helpers** live in `@choices/civics-shared` so the ingest service and orchestrator stay in lockstep.

The `src/scripts/` directory is now organised around the ingest lifecycle:
- `openstates/` – people YAML staging and SQL merge orchestration.
- `federal/` – enrichment passes for Congress.gov, GovInfo, and FEC.
- `state/` – OpenStates API-driven refreshers for contacts, committees, activity, and provenance.
- `tools/` – diagnostics, repair tools, and reporting utilities (duplicates, schema introspection, coverage gaps).

Each writer uses replace-by-source semantics: rows inserted with `source = 'openstates_yaml'` are deleted before new data is written, ensuring idempotent reruns.

---

## 5. Command reference (extended)

| Command | Purpose (plain language) | Good to know |
| --- | --- | --- |
| `npm run openstates:ingest` | Pull latest OpenStates data, merge into Supabase, refresh bill activity | Requires `.env.local` and local YAML |
| `npm run ingest:qa` | Verify schema alignment, duplicate canonicals, and preview records | Fails fast with actionable guidance |
| `npm run preview` | Show sample representatives without writing anything | Use `--states` / `--limit` |
| `npm run federal:enrich:finance` | Fetch FEC totals & contributors and update Supabase rows | Records “no data” placeholders when FEC has nothing |
| `npm run federal:enrich:congress` | Hydrate missing bioguide, Congress.gov, and GovInfo IDs | Honors `--dry-run` for change previews |
| `npm run state:sync:committees` | Rebuild committee memberships from OpenStates roles | Automatically run post-merge coverage coming soon |
| `npm run state:sync:activity` | Rebuild bill activity (only needed if you skipped the auto-sync) | Honors `OPENSTATES_ACTIVITY_LIMIT` |
| `npm run state:sync:google-civic` | Pull supplemental contacts/social/photos from Google Civic | Requires `GOOGLE_CIVIC_API_KEY`; writes to `representative_contacts` (`source = google_civic`) |
| `npm run state:refresh` | Sequentially run contacts → social → photos → committees → activity → data sources → Google Civic | Accepts `--states`, `--limit`, `--dry-run`, `--only`, `--skip` |
| `npm run tools:report:gaps` | Show remaining finance/contact/identifier gaps | Helps prioritise follow-up runs |
| `npm run tools:report:duplicates` / `npm run tools:fix:duplicates` | Inspect and repair duplicate canonicals | Always re-run `ingest:qa` afterward |
| `npm run tools:audit:crosswalk` / `npm run tools:fix:crosswalk` | Validate canonical ID mappings | Keeps external IDs aligned |
| `npm run tools:inspect:schema` | Print live Supabase column definitions | Useful before changing ingest logic |
| `npm run state:sync:social` / `npm run state:sync:contacts` / `npm run state:sync:photos` | Rebuild targeted tables from OpenStates YAML | Support `--dry-run`, `--states`, `--limit` |

For the full list—including `openstates:stage`, `openstates:merge`, and development helpers—inspect `package.json` or the **Operations Guide** linked below.

---

## 6. Quality guarantees & troubleshooting
- **QA is mandatory.** If `npm run ingest:qa` fails, follow the instructions it prints or consult the troubleshooting tables in `docs/civics-backend-operations.md`.
- **Dry-runs are your friend.** Every legacy sync/enrich command honors `--dry-run` for safe previews.
- **Chunked Supabase queries** are built-in; large `.in()` calls won’t overflow URLs.
- **Bill activity metrics** (`processed/total/failed`) appear after each merge so you can confirm OpenStates API calls succeeded.
- **Rate limits?** Finance and OpenStates clients log warnings; wait a minute or rerun with a smaller `--limit`.

---

## 7. Further reading
- [`docs/civics-backend-quickstart.md`](../../docs/civics-backend-quickstart.md) – step-by-step checklist for non-technical operators.
- [`docs/civics-backend-operations.md`](../../docs/civics-backend-operations.md) – deeper architecture notes, command catalogue, troubleshooting.
- [`docs/civics-ingest-checklist.md`](../../docs/civics-ingest-checklist.md) – printable pre-ingest → post-ingest checklist.
- [`docs/civics-ingest-supabase-plan.md`](../../docs/civics-ingest-supabase-plan.md) – table-by-table roadmap for remaining Supabase integrations.
- [`services/civics-backend/env.example`](./env.example) – reference environment file.

Keep these resources updated whenever scripts gain new features or data contracts change—clarity for the next operator is part of the deliverable.

