# Services Overview

The `services/` directory hosts **standalone** tooling that powers the Choices civic data **ingest** stack. It is intended as a self-contained “gift” for civic-minded developers: you can use the ingest pipeline and shared helpers with your own Supabase project or fork, without depending on the rest of the repo.

**New agent?** Start with **[AGENT_ONBOARDING.md](AGENT_ONBOARDING.md)** — single entry point for understanding, catching up, and continuing ingest.

## Architecture (ingest vs user-facing)

- **Civics service = data ingest to Supabase only.** It fetches from OpenStates, FEC, Google Civic, etc., and writes into Supabase. It has no user-facing role.
- **All user-facing civics data comes from Supabase.** The web app reads representatives, elections, committees, activity, and related data **only** from Supabase (via API routes that query the database). Users never call OpenStates, FEC, or Google Civic directly.
- **The only user-facing external API is address lookup.** The web app exposes `/api/v1/civics/address-lookup`, which calls an external API (e.g. Google Civic) to resolve an address → jurisdiction. That is the sole exception; all other civics data is served from Supabase.

**Quick start:** `cd civics-backend && npm run ingest:setup && npm run ingest`. See [civics-backend/NEW_civics_ingest/docs/GETTING_STARTED.md](civics-backend/NEW_civics_ingest/docs/GETTING_STARTED.md).

**Gap-fill (standalone):** `npm run gap:fill` — Identifies missing data, checks rate limits, and fills gaps. Backs off when limits are reached. Safe to run repeatedly (e.g. cron).

We organise active components in the order each runbook should execute them:

1. **OpenStates People YAML ingest** (`civics-backend/NEW_civics_ingest/openstates/`)  
   - Stage raw YAML into Supabase staging tables.  
   - Run the SQL merge to upsert canonical representative records.

2. **Federal enrichment** (`civics-backend/NEW_civics_ingest/federal/`)  
   - Hydrate Congress.gov, GovInfo, and FEC finance identifiers.  
   - Updates flow into the same canonical IDs established during the YAML merge.

3. **State enrichment** (`civics-backend/NEW_civics_ingest/openstates/`, `state:sync:*` or `openstates:sync:*`)  
   - Refresh OpenStates API–derived contacts, committees, photos, activity, and provenance rows.  
   - Use `openstates:sync:committees`, `openstates:sync:activity`, etc. for targeted reruns.  
   - Commands accept `--states`, `--limit`, `--dry-run`, and `--resume` for scoped execution.

4. **Gap-fill orchestrator** (`npm run gap:fill`)  
   - Identifies missing data (finance, congress IDs, activity, committees).  
   - Checks API rate limits before each step; backs off when limits are reached.  
   - Fills gaps in priority order: committees → activity → federal congress → federal finance.  
   - Safe to run repeatedly; use `--dry-run` to preview.

5. **Gap-filling tools** (`civics-backend/NEW_civics_ingest/scripts/tools/`)  
   - Diagnostics and repair utilities: schema inspection, duplicate cleanup, coverage reports (`tools:report:gaps`), crosswalk fixes.

- **`civics-shared/`** – Shared helpers (division metadata, FEC office codes, campaign finance utilities, issue signals from bills). Used by both `civics-backend` and the web app; keep this package as the single source of truth.
- **`docs/archive/runbooks/`** (repo root) – Database runbooks, Supabase CLI usage, and migrations.

When adding a new workflow, slot it into the stage → federal → state → tools hierarchy and update this file plus [civics-backend/NEW_civics_ingest/docs/](civics-backend/NEW_civics_ingest/docs/).


