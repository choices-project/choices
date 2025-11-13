# Services Overview

The `services/` directory hosts standalone tooling that powers the Choices civic data ingest stack. We organise active components in the order each runbook should execute them:

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

Shared helpers that underpin these pipelines live in `civics-shared/`, while database runbooks and Supabase CLI notes remain in `supabase-operations-guide.md`. When adding a new workflow, slot it into the stage → federal → state → tools hierarchy and update this file plus the corresponding documentation in `docs/`.


