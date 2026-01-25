# Civics Backend Roadmap

**Last Updated:** 2026-01-27  
**Status:** Schema optimizations complete, migrations applied ✅

This plan tracks all work for the civics backend ingest and database optimizations. Update checklist items as work progresses.

---

## Agent Onboarding: Using Supabase MCP

**For AI agents working on this codebase:** This project uses the Supabase MCP (Model Context Protocol) for database operations. Always use the Supabase MCP tools instead of direct SQL execution when possible.

### Quick Start

1. **Verify MCP is configured** - Check that Supabase MCP is available via `call_mcp_tool` with server `project-0-Choices-supabase`

2. **Available MCP Tools:**
   - `apply_migration` - Apply DDL migrations (CREATE, ALTER, DROP)
   - `execute_sql` - Execute read/write SQL queries
   - `list_migrations` - View applied migrations
   - `list_tables` - Discover database schema
   - `get_advisors` - Security/Performance recommendations

3. **Applying Migrations:**
   ```typescript
   // Use apply_migration for DDL operations
   call_mcp_tool({
     server: "project-0-Choices-supabase",
     toolName: "apply_migration",
     arguments: {
       name: "migration_name_snake_case",
       query: "-- SQL migration content here"
     }
   })
   ```

4. **Querying Data:**
   ```typescript
   // Use execute_sql for queries
   call_mcp_tool({
     server: "project-0-Choices-supabase",
     toolName: "execute_sql",
     arguments: {
       query: "SELECT * FROM representatives_core LIMIT 10;"
     }
   })
   ```

5. **Best Practices:**
   - ✅ Always use `apply_migration` for schema changes (DDL)
   - ✅ Use `execute_sql` for data queries and DML operations
   - ✅ Check migration status with `list_migrations` before applying
   - ✅ Verify schema with `list_tables` when unsure about table structure
   - ❌ Don't hardcode table names - verify with `list_tables` first
   - ❌ Don't apply migrations out of order - check `MIGRATION_ORDER.md`

6. **Migration Files Location:**
   - All migrations: `supabase/migrations/20260127*.sql`
   - Migration order: See `docs/MIGRATION_ORDER.md`
   - Status guide: See `docs/STATUS_MIGRATION_GUIDE.md`

7. **Common Tasks:**
   - **Apply a migration:** Read the `.sql` file, then use `apply_migration` with the full SQL content
   - **Check migration status:** Use `list_migrations` to see what's been applied
   - **Query representatives:** Use `execute_sql` with `SELECT * FROM representatives_core WHERE status = 'active'`
   - **Verify constraints:** Use `execute_sql` to query `pg_constraint` or `pg_indexes`

**See also:** `/Users/alaughingkitsune/src/Choices/docs/AGENT_SETUP.md` for full MCP setup instructions.

---

---

## Phase 1 — Dataset Coverage Audit

- [x] **Inventory OpenStates YAML fields**  
  Coverage matrix captured in `docs/openstates-yaml-coverage.md` (updated Nov 2025).

- [x] **Assess canonical object gaps**  
  `CanonicalRepresentative` expanded to include biographies, aliases, extras, division IDs, office metadata, social merge, and a regression test (`src/__tests__/openstates-people.test.ts`).

- [x] **Review staging schema**  
  Staging utilities now store `other_identifiers` and dedupe schemes; truncation limits recorded in the coverage doc.

Deliverables: ✅ coverage report + TODO follow-ups logged inline where future work remains (e.g., optional staging of raw payload hashes).

---

## Phase 2 — Persistence Verification

- [x] **Trace merge flow**  
  Staging → SQL merge → downstream tables flow documented in `docs/INGEST_FLOWS.md`.

- [ ] **Validation harness**  
  - [x] Canonical regression test in `src/__tests__`.  
  - [ ] Staging/merge fixtures (mock Supabase) TODO.  
  - [ ] CLI smoke-test template for live Supabase (guard env vars).

- [x] **Current-only guarantee**  
  Documented in the verification plan; SQL function already filters `is_current = true`.

- [ ] **Term / next_election verification**  
  `sync_representatives_from_openstates` sets `term_start_date` and `term_end_date` from OpenStates roles (`start_date` / `end_date`). `next_election_date` is **not** populated by the merge. Populate via state/federal enrich or derive from `term_end_date` where applicable. Validate that `term_end_date` and `next_election_date` are set for current terms when running QA (e.g. `ingest:qa`, `tools:inspect:schema`).

- [x] **Representative activity audit**  
  Canonical `representative_activity` = **bills only** (`type: 'bill'`). See `src/persist/activity.ts`. Run `npm run tools:audit:activity` to report non‑bill or `Election:…` rows; `npm run tools:audit:activity -- --fix` to delete them. Now included in `ingest:qa`. Activity rows store sponsorship (primary/cosponsor) and votes when available (see `persist/activity.ts`).

Deliverables: docs updated; remaining work is to build fixture-driven staging tests and live smoke-test harness.

---

## Phase 3 — Ingestion Flow Hardening

- [x] **Define three independent flows**  
  See `docs/INGEST_FLOWS.md`; outlines OpenStates YAML baseline + state/federal enrichment responsibilities.

- [ ] **Crosswalk + dedupe strategy**  
  Parser + Supabase adapters now capture “other” identifiers; still need automated duplicate auditing + quality scoring updates.

- [ ] **API call optimisation matrix**  
  See `docs/INGEST_FLOWS.md`; next step is encoding the logic in enrichers and CLI filters.

Deliverables: docs refreshed; follow-up items remain for crosswalk automation and API throttling heuristics.

---

## Phase 4 — Implementation Pass

- [x] Patch canonical parser/stager with audited gaps (dates, biographies, extras, alt names, contact metadata).  
- [x] Extend enrichers (`enrich/state`, `enrich/federal`) + preview tooling to surface the new data.  
- [x] Update Supabase adapters/crosswalk to handle `identifiers.other` and enriched roles.  
- [ ] Regenerate Supabase types (`npx supabase gen types typescript …`) after next schema change (not required yet).

Deliverables: implementation merged; outstanding item is regenerating shared types when table updates land.

---

## Phase 5 — Documentation & Handoff

- [x] Refresh operator docs with preview/enrichment guidance.  
- [x] Verification recipe documented in `docs/INGEST_FLOWS.md`.  
- [x] Ingest progress tracked in this roadmap.  
- [ ] Archive/deprecate legacy scripts once SQL-first replacements are ubiquitous.

Deliverables: docs largely refreshed; need status roll-up + archival sweep.

---

## Phase 6 — Future Enhancements (Backlog)

- [ ] Automate ingest smoke test in CI (fixture-driven).  
- [ ] Add metrics/logging (processed counts, error surfacing) to scripts.  
- [ ] Explore storing raw YAML snapshots or hashes for audit in `representative_data_sources`.  
- [ ] Prep scaffolding for next APIs (Congress committees, state bill activity) once baseline is locked.

---

## Phase 0 — Schema Optimizations (APPLIED ✅)

**Status:** All migrations created, code updated, and **successfully applied via Supabase MCP**

### Database Migrations (10 files created - ready to apply)
- [x] **Unique constraints** - `20260127130000` - Partial unique indexes on identifiers
- [x] **Performance indexes** - `20260127130100` - Composite, partial, GIN indexes
- [x] **Check constraints** - `20260127130200` - Data validation
- [x] **NOT NULL constraints** - `20260127130300` - Critical fields with safe defaults
- [x] **Updated_at triggers** - `20260127130400` - Auto-updating timestamps
- [x] **Foreign key indexes** - `20260127130500` - All FK columns indexed
- [x] **Status tracking schema** - `20260127130600` - ENUM, replacement tracking
- [x] **Sync function updates** - `20260127130700` - Deactivate function
- [x] **Status helper** - `20260127130800` - Conversion function
- [x] **Comprehensive sync** - `20260127130900` - Full sync function with status

### Code Updates (COMPLETE ✅)
- [x] **enrich-congress-ids.ts** - Updated to use `status` field
- [x] **Frontend queries** - All API routes use `status = 'active'`
- [x] **Type definitions** - Added status fields to interfaces
- [x] **SQL functions** - Sync and deactivate functions updated

### Application Status

**✅ All migrations successfully applied via Supabase MCP**

All 10 migrations have been applied using the Supabase MCP `apply_migration` tool. Migration status verified via `list_migrations`.

**Applied Migrations:**
1. ✅ Unique constraints (`20260127130000`) - Indexes created (deduplication needed for full enforcement)
2. ✅ Performance indexes (`20260127130100`) - Applied
3. ✅ Check constraints (`20260127130200`) - Applied (data issues fixed)
4. ✅ NOT NULL constraints (`20260127130300`) - Applied
5. ✅ Updated_at triggers (`20260127130400`) - Applied
6. ✅ Foreign key indexes (`20260127130500`) - Applied
7. ✅ Status tracking schema (`20260127130600`) - Applied
8. ✅ Sync function updates (`20260127130700`) - Applied
9. ✅ Status helper (`20260127130800`) - Applied
10. ✅ Comprehensive sync function (`20260127130900`) - Applied

**Migration files:** All in `supabase/migrations/20260127*.sql`

### Next Steps
- [x] **Apply migrations** - ✅ Complete via Supabase MCP
- [x] **Wipe tables** - ✅ All representative tables cleared for fresh start
- [x] **Verify migrations** - ✅ All aspects verified
- [x] **OpenStates People Ingestion** - ✅ Complete (8,108 representatives loaded)
- [x] **Congress.gov Enrichment** - ✅ Complete (547 federal representatives, 102 Senators, 445 Representatives)
- [ ] **FEC Enrichment** - Add FEC campaign finance data (requires FEC IDs from Congress.gov)
- [ ] **State Enrichment** - Optional API-based refreshes
- [ ] **Verify data** - Test queries, status tracking, constraints with real data

**Migration files:** `supabase/migrations/20260127*.sql`  
**Migration guide:** `docs/MIGRATION_ORDER.md`  
**Status migration:** `docs/STATUS_MIGRATION_GUIDE.md`

### Fresh Start Complete ✅

All representative tables have been cleared for a fresh start:

**Cleared Tables:**
- ✅ `representatives_core` (main table)
- ✅ `representative_contacts`
- ✅ `representative_social_media`
- ✅ `representative_photos`
- ✅ `representative_committees`
- ✅ `representative_campaign_finance`
- ✅ `representative_data_sources`
- ✅ `representative_data_quality`
- ✅ `representative_crosswalk_enhanced`
- ✅ `representative_activity`
- ✅ `representative_divisions`

**Verification Results:**
- ✅ All 10 migrations applied and verified
- ✅ Unique indexes: `openstates_id`, `bioguide_id`, `canonical_id`
- ✅ Performance indexes: 7 composite/partial/GIN indexes
- ✅ Check constraints: 7 validation constraints
- ✅ NOT NULL constraints: `name`, `state`, `level`, `status`
- ✅ Updated_at triggers: Applied to all representative tables
- ✅ Status enum: `active`, `inactive`, `historical`
- ✅ Status columns: All 4 columns present
- ✅ Sync function: `sync_representatives_from_openstates` with status tracking

**Ready for:** Fresh ingest with optimized schema and status tracking.

---

## OpenStates People Ingestion (COMPLETE ✅)

**Status:** Successfully completed on 2026-01-27

### Results

**Staging:**
- ✅ 25,141 person records loaded
- ✅ 30,523 contacts
- ✅ 30,433 roles
- ✅ 35,002 identifiers
- ✅ 45,001 alternate names
- ✅ 3,365 social media handles
- ✅ 104,077 source references

**Merge:**
- ✅ 8,108 representatives loaded into `representatives_core`
- ✅ All have `status = 'active'` (fresh start)
- ✅ 7,928 state-level, 180 local
- ✅ 8,108 divisions created
- ✅ 0 duplicates detected

**QA Verification:**
- ✅ Schema verified (status field present)
- ✅ No duplicates found
- ✅ Sample data validated

**Note:** Activity sync hit OpenStates API rate limits (429), which is expected. Can be run separately later.

**Files moved to NEW_civics_ingest:**
- ✅ `openstates/` directory with staging and merge scripts

---

## Congress.gov Enrichment (COMPLETE ✅)

**Status:** Successfully completed with all issues resolved

### Results
- ✅ 547 federal representatives added (102 Senators, 445 Representatives)
- ✅ All have `bioguide_id` and `congress_gov_id` (100% coverage)
- ✅ Senator classification bug fixed
- ⚠️ GovInfo IDs: 0/547 (API experiencing 500 errors, optional enrichment)

### Optimizations Applied

**Validation & Verification:**
- ✅ Added member count validation in `congress.ts` (expected ~535 members)
- ✅ Added post-enrichment verification in `enrich-congress-ids.ts`
- ✅ Validates Senators (~100) and Representatives (~435) counts
- ✅ Logs warnings if counts outside expected ranges

**Bug Fixes:**
- ✅ Fixed `deriveOffice()` function to correctly identify Senators
- ✅ Applied database correction for misclassified Senators

**API Behavior Clarification:**
- ✅ Documented that `/member/congress/119` returns ALL currently serving members
- ✅ Includes Senators continuing from 118th Congress (6-year terms)
- ✅ Includes all newly elected Representatives (2-year terms)

**Script Compatibility:**
- ✅ Uses `status = 'active'` for filtering
- ✅ Uses `update_representative_status()` RPC for deactivation
- ✅ Sets `verification_status = 'pending'` for new reps
- ✅ Includes `status` field in interface

**Documentation:**
- ✅ Created `CONGRESS_ENRICHMENT_ANALYSIS.md` and `CONGRESS_ENRICHMENT_FINAL_STATUS.md`
- ✅ Updated `federal_enrichment_guide_ce1b0f15.plan.md` with verification steps
- ✅ Added troubleshooting guidance for member count issues

**GovInfo MCP Consideration:**
- 📋 GovInfo now offers Model Context Protocol (MCP) server (public preview)
- ⚠️ **Not useful for current use case** (member lookups) - MCP focuses on document access
- ✅ **High potential value** for future features: "Walk the Talk" analysis, vote tracking, bill text access
- 📋 See `GOVINFO_MCP_BENEFITS_ANALYSIS.md` for detailed evaluation
- 📋 Documentation: https://github.com/usgpo/api/blob/main/docs/mcp.md

**Ready for:** FEC enrichment (next step)

---

Update this roadmap as tasks complete or priorities change. Use pull request references (`PR #123`) next to checklist items when closing them out.


