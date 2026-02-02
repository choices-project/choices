# Investigation Findings: Committees Sync Issue

**Date:** 2026-01-27  
**Status:** Root cause identified, solution documented

## Problem Statement

The committees sync reports "complete" but the database shows **0 committees** in `representative_committees` table.

## Root Cause Analysis

### Database Schema Verification ✅

**Table: `representative_committees`**
- Schema verified via Supabase MCP
- Columns: `id`, `representative_id`, `committee_name`, `role`, `start_date`, `end_date`, `is_current`, `created_at`, `updated_at`
- **Current data:** 0 rows (both total and current)

**Table: `openstates_people_roles`**
- Contains role data from YAML staging
- **Issue:** Only contains legislative/executive roles, NOT committee roles
- Role types found: `lower`, `upper`, `legislature`, `executive`, `municipal`, `mayor`, `governor`, `secretary of state`, `chief election officer`
- **Committee roles:** 0 found in this table

### Code Flow Analysis

1. **`fetchCommitteeAssignmentsFromYAML()`** (lines 62-139 in `enrich/committees.ts`)
   - Queries `openstates_people_roles` table
   - Filters out `LEGISLATIVE_ROLE_TYPES` (lower, upper, legislature, executive, etc.)
   - Looks for roles with `normaliseRoleType()` that match committee types
   - **Problem:** No committee roles exist in `openstates_people_roles` table
   - **Result:** Always returns empty array `[]`

2. **`fetchCommitteeAssignmentsFromAPI()`** (lines 144-207)
   - Fetches committees from OpenStates API using `fetchCommittees()`
   - Matches committee memberships by `openstates_id`
   - **This is the only source that can provide committee data**

3. **`fetchCommitteeAssignments()`** (lines 213-256)
   - Merges YAML (always empty) + API data
   - API data should be the primary source

### Why Committees Sync Failed

**Hypothesis:** The API calls are either:
1. Not being made (API disabled or error)
2. Returning empty results (no committees found)
3. Failing silently (errors caught but not logged)

**Evidence:**
- Sync log shows: "✅ Committees sync complete" but no row counts
- No errors in logs
- Database has 0 committees

## Data Source Investigation

### YAML Data Structure
- Committee data exists in YAML files: `data/openstates-people/data/*/committees/*.yml`
- **BUT:** These are NOT loaded into `openstates_people_roles` table
- Committees are stored as separate entities, not as roles

### API Data Source
- OpenStates API `/committees/` endpoint
- Requires jurisdiction filter
- Returns committees with memberships array
- **This is the primary/only viable source for committee data**

## Solution

### Immediate Fix
1. **Verify API is enabled:** Check `OPENSTATES_USE_API_COMMITTEES` env var (defaults to `true`)
2. **Add detailed logging:** Log API call results, assignment counts per representative
3. **Test with single representative:** Run sync for one rep to see actual API response

### Long-term Improvements
1. **Remove YAML committee lookup:** Since YAML doesn't have committee roles in `openstates_people_roles`, remove the YAML lookup or document it as always empty
2. **Add error handling:** Ensure API errors are logged, not silently caught
3. **Add progress reporting:** Show actual assignment counts in sync output

## Database Functions Verified

**RPC Functions (via Supabase MCP):**
- `sync_representatives_from_openstates` - Main sync function ✅
- `update_representative_status` - Status updates ✅
- `touch_representative_divisions` - Division tracking ✅
- **No committee-specific RPC functions found** (committees are written directly via Supabase client)

## Recommendations

1. **Add verbose logging** to `sync-committees.ts` to show:
   - API calls made
   - Committees found per jurisdiction
   - Assignments created per representative
   - Errors encountered

2. **Test API connectivity:**
   ```bash
   # Test fetchCommittees with a known jurisdiction
   npm run tools:test:committees -- --jurisdiction=ocd-jurisdiction/country:us/state:ca
   ```

3. **Verify environment variables:**
   - `OPENSTATES_API_KEY` - Required for API calls
   - `OPENSTATES_USE_API_COMMITTEES` - Should be `true` (default)

4. **Consider adding dry-run mode** to see what would be synced without writing

---

**Next Steps:**
1. Add detailed logging to committees sync
2. Test API calls with verbose output
3. Verify environment configuration
4. Re-run sync with logging enabled
