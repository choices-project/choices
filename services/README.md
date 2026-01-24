# Services Overview

The `services/` directory hosts **standalone** tooling that powers the Choices civic data **ingest** stack. It is intended as a self-contained “gift” for civic-minded developers: you can use the ingest pipeline and shared helpers with your own Supabase project or fork, without depending on the rest of the repo.

## Architecture (ingest vs user-facing)

- **Civics service = data ingest to Supabase only.** It fetches from OpenStates, FEC, Google Civic, etc., and writes into Supabase. It has no user-facing role.
- **All user-facing civics data comes from Supabase.** The web app reads representatives, elections, committees, activity, and related data **only** from Supabase (via API routes that query the database). Users never call OpenStates, FEC, or Google Civic directly.
- **The only user-facing external API is address lookup.** The web app exposes `/api/v1/civics/address-lookup`, which calls an external API (e.g. Google Civic) to resolve an address → jurisdiction. That is the sole exception; all other civics data is served from Supabase.

We organise active components in the order each runbook should execute them:

1. **OpenStates People YAML ingest** (`civics-backend/src/scripts/openstates/`)  
   - Stage raw YAML into Supabase staging tables.  
   - Run the SQL merge to upsert canonical representative records.

2. **Federal enrichment** (`civics-backend/src/scripts/federal/`)  
   - Hydrate Congress.gov, GovInfo, and FEC finance identifiers.  
   - Updates flow into the same canonical IDs established during the YAML merge.

3. **State enrichment** (`civics-backend/src/scripts/state/`)  
   - Refresh OpenStates API–derived contacts, committees, photos, activity, and provenance rows.  
   - Pull supplemental contacts, social handles, portraits, and election metadata from the Google Civic Information API.  
   - Use `state:refresh` to run the full stack (including Google Civic) or `state:sync:*` commands for targeted reruns.  
   - Commands accept `--states`, `--limit`, and `--dry-run` for scoped execution.

4. **Gap-filling tools** (`civics-backend/src/scripts/tools/`)  
   - Diagnostics and repair utilities: schema inspection, duplicate cleanup, coverage reports, crosswalk fixes.

- **`civics-shared/`** – Shared helpers (division metadata, FEC office codes, campaign finance utilities, issue signals from bills). Used by both `civics-backend` and the web app; keep this package as the single source of truth.
- **`supabase-operations-guide.md`** – Database runbooks, Supabase CLI usage, and migrations.

When adding a new workflow, slot it into the stage → federal → state → tools hierarchy and update this file plus any docs in `civics-backend/docs/` or `docs/`.


