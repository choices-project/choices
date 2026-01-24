# Civics Backend Ingest

The Civics Backend is a **standalone ingest-only service** that keeps Supabase stocked with accurate representative data (contacts, committees, bill activity, elections, finance) sourced from OpenStates, FEC, and Google Civic. It writes into Supabase; it does **not** serve users. All user-facing civics data comes from Supabase. The only external API users touch is **address lookup** (handled by the web app’s `/api/v1/civics/address-lookup` endpoint).

You do not need to touch the web app to operate the ingest—just load the environment file, run the provided scripts, and verify the results.

If you are new to the project or prefer a checklist-style walk-through, start with **[`docs/archive/reference/civics/civics-backend-quickstart.md`](../../docs/archive/reference/civics/civics-backend-quickstart.md)**. The remainder of this README gives additional detail for operators who want to understand how pieces fit together.

---

## 1. Who should use this?
- Anyone tasked with refreshing civic representative data on a regular cadence.
- Civic partners who want a reusable ingest pipeline for their own Supabase project.
- Engineers extending the ingest scripts with new sources or QA checks.

---

## 2. Setup at a glance
1. Copy `env.example` to `.env` in `services/civics-backend/` and provide:
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

> **Remember:** keep `.env` out of version control. Scripts load it via `dotenv/config`.

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
- `npm run state:sync:google-elections -- --dry-run` – pull the Google Civic election list into `civic_elections`.
- `npm run state:sync:committees` – refresh committee assignments (the merge already writes the default OpenStates snapshot).
- `npm run state:sync:activity` – replay bill activity if you skipped the automatic step or need a narrow refresh.

All commands accept `--states`, `--limit`, and `--dry-run` for safe testing. Finance-specific scripts also support `--stale-days`, `--include-existing`, and `--cycle`.

---

## 4. What happens under the hood
- **Ingest-only.** This service fetches from external APIs (OpenStates, FEC, Google Civic) and **writes** into Supabase. The web app serves users **only** from Supabase (and from the address-lookup endpoint, which is the sole user-facing external API).
- **Stage loader** (`src/scripts/openstates/stage-openstates.ts`) ingests the raw YAML into staging tables.
- **SQL merge** (`sync_representatives_from_openstates`) updates `representatives_core` plus contacts, social, photos, provenance, and quality metrics.
- **Post-merge activity sync** replays OpenStates bill data into `representative_activity` (unless you set `SKIP_ACTIVITY_SYNC`).
- **Federal enrichers** (`src/scripts/federal/*`) hydrate Congress.gov IDs and FEC data separately from the YAML ingest.
- **State refreshers** (`state:sync:contacts` / `social` / `photos` / `committees` / `activity` / `data-sources` / `google-civic` / `google-elections`) remain available for surgical reruns while we continue expanding the SQL-first flow.
- **Shared helpers** live in `@choices/civics-shared` so the ingest service and web app stay in lockstep.

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
| `npm run preview` | Sample from `representatives_core` (total, by level, N rows). Used by `ingest:qa`. | `--limit=N`, `--states=X,Y`. Use `--pipeline` for pipeline-based federal/state preview. |
| `npm run federal:enrich:finance` | Fetch FEC totals & contributors and update Supabase rows | Records “no data” placeholders when FEC has nothing |
| `npm run federal:enrich:congress` | Hydrate missing bioguide, Congress.gov, and GovInfo IDs | Honors `--dry-run` for change previews |
| `npm run state:sync:committees` | Rebuild committee memberships from OpenStates roles | Automatically run post-merge coverage coming soon |
| `npm run state:sync:activity` | Rebuild bill activity (only needed if you skipped the auto-sync) | Honors `OPENSTATES_ACTIVITY_LIMIT` |
| `npm run state:sync:google-civic` | Pull supplemental contacts/social/photos from Google Civic | Requires `GOOGLE_CIVIC_API_KEY`; writes to `representative_contacts` (`source = google_civic`) |
| `npm run state:sync:google-elections` | Upsert upcoming elections from Google Civic into Supabase | Requires `GOOGLE_CIVIC_API_KEY`; writes to `civic_elections` |
| `npm run state:sync:voter-registration` | Refresh state voter registration resources | Loads curated JSON (local or remote), supports `--dry-run`; populates `voter_registration_resources` |
| `npm run state:sync:divisions` | Rebuild `representative_divisions` from OpenStates roles | Invokes `refresh_divisions_from_openstates()` RPC |
| `npm run state:refresh` | Sequentially run contacts → social → photos → committees → activity → data sources → Google Civic → Google elections | Accepts `--states`, `--limit`, `--dry-run`, `--only`, `--skip` |
| `npm run tools:report:gaps` | Show remaining finance/contact/identifier gaps | Helps prioritise follow-up runs |
| `npm run tools:report:duplicates` / `npm run tools:fix:duplicates` | Inspect and repair duplicate canonicals | Always re-run `ingest:qa` afterward |
| `npm run tools:audit:crosswalk` / `npm run tools:fix:crosswalk` | Validate canonical ID mappings | Keeps external IDs aligned |
| `npm run tools:inspect:schema` | Print live Supabase column definitions | Useful before changing ingest logic |
| `npm run tools:audit:activity` | Report non‑bill / `Election:…` rows in `representative_activity` | Use `-- --fix` to delete them; canonical = bills only |
| `npm run state:sync:social` / `npm run state:sync:contacts` / `npm run state:sync:photos` | Rebuild targeted tables from OpenStates YAML | Support `--dry-run`, `--states`, `--limit` |

For the full list—including `openstates:stage`, `openstates:merge`, and development helpers—inspect `package.json` or the **Operations Guide** linked below.

---

## 6. Quality guarantees & troubleshooting
- **QA is mandatory.** If `npm run ingest:qa` fails, follow the instructions it prints or consult the troubleshooting tables in `docs/archive/reference/civics/civics-backend-operations.md`.
- **Dry-runs are your friend.** Every legacy sync/enrich command honors `--dry-run` for safe previews.
- **Chunked Supabase queries** are built-in; large `.in()` calls won’t overflow URLs.
- **Bill activity metrics** (`processed/total/failed`) appear after each merge so you can confirm OpenStates API calls succeeded.
- **Rate limits?** Finance and OpenStates clients log warnings; wait a minute or rerun with a smaller `--limit`.

---

## 7. Schema & RPC verification (Supabase MCP)
Use **Supabase MCP** (`list_tables`, `execute_sql`, `get_advisors`) to verify civics schema, RPCs, and functions. See [`docs/supabase-mcp-verification.md`](./docs/supabase-mcp-verification.md) for the exact checks and SQL. Run after schema changes or before major ingest runs.

---

## 8. Further reading
- [`docs/supabase-mcp-verification.md`](./docs/supabase-mcp-verification.md) – Supabase MCP checks for civics schema, RPCs, functions.
- [`docs/archive/reference/civics/civics-backend-quickstart.md`](../../docs/archive/reference/civics/civics-backend-quickstart.md) – step-by-step checklist for non-technical operators.
- [`docs/archive/reference/civics/civics-backend-operations.md`](../../docs/archive/reference/civics/civics-backend-operations.md) – deeper architecture notes, command catalogue, troubleshooting.
- [`docs/archive/reference/civics/civics-ingest-checklist.md`](../../docs/archive/reference/civics/civics-ingest-checklist.md) – printable pre-ingest → post-ingest checklist.
- [`docs/archive/reference/civics/civics-ingest-supabase-plan.md`](../../docs/archive/reference/civics/civics-ingest-supabase-plan.md) – table-by-table roadmap for remaining Supabase integrations.
- [`env.example`](./env.example) – reference environment file (copy to `.env` in this directory; scripts load it via `dotenv`).

Keep these resources updated whenever scripts gain new features or data contracts change—clarity for the next operator is part of the deliverable.

