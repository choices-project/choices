# Audit: Outdated Files for Archival

**Generated:** 2026-01-27  
**Status:** Comprehensive audit of civics ingest codebase

## Executive Summary

The codebase has been reorganized with current files in `NEW_civics_ingest/` and outdated files in `archive/`. This audit identifies:
- ✅ Files already archived (correctly)
- ⚠️ Files that should be archived (duplicates/outdated)
- 🔧 Configuration issues fixed

## Files Already Archived (Correct)

### `archive/src/scripts/state/` - ✅ Correctly Archived
These are old versions that have been superseded by `NEW_civics_ingest/openstates/`:
- `sync-activity.ts` - Old version (missing `--resume` flag support)
- `sync-committees.ts` - Old version
- `sync-contacts.ts` - Old version
- `sync-data-sources.ts` - Old version
- `sync-photos.ts` - Old version
- `sync-social.ts` - Old version (different from current)
- `sync-divisions.ts` - May still be needed (check if used)
- `sync-google-civic.ts` - May still be needed (check if used)
- `sync-google-elections.ts` - May still be needed (check if used)
- `sync-voter-registration.ts` - May still be needed (check if used)

### `archive/src/scripts/openstates/` - ✅ Correctly Archived
Old versions superseded by `NEW_civics_ingest/openstates/`:
- `sync-activity.ts` - Old version
- `sync-committees.ts` - Old version
- `sync-contacts.ts` - Old version
- `sync-data-sources.ts` - Old version
- `sync-photos.ts` - Old version
- `sync-social.ts` - Old version

### `archive/docs-old/` - ✅ Correctly Archived
Old documentation superseded by `NEW_civics_ingest/docs/`:
- `CONGRESS_ENRICHMENT_ANALYSIS.md`
- `CONGRESS_ENRICHMENT_FINAL_STATUS.md`
- `FEC_ENRICHMENT_DATA_VERIFICATION.md`
- `FEC_ENRICHMENT_TEST.md`
- `GOVINFO_MCP.md` (superseded by `NEW_civics_ingest/docs/GOVINFO_MCP.md`)
- `ROADMAP.md` (superseded by `NEW_civics_ingest/docs/ROADMAP.md`)

## Current File Structure (Correct)

### `NEW_civics_ingest/openstates/` - ✅ Current
All sync scripts are here:
- `sync-activity.ts` - **Current** (uses `workflows/activity-sync.ts` with resume support)
- `sync-committees.ts` - **Current**
- `sync-contacts.ts` - **Current**
- `sync-data-sources.ts` - **Current**
- `sync-events.ts` - **Current**
- `sync-photos.ts` - **Current**
- `sync-social.ts` - **Current**
- `sync-all.ts` - **Current**
- `stage-openstates.ts` - **Current**
- `run-openstates-merge.ts` - **Current**

## Configuration Issues Fixed

### ✅ Fixed: `package.json` Script Paths
**Issue:** Scripts referenced non-existent `build/scripts/state/` paths  
**Fixed:** Updated to correct `build/openstates/` paths:
- `state:sync:committees` → `build/openstates/sync-committees.js`
- `state:sync:contacts` → `build/openstates/sync-contacts.js`
- `state:sync:social` → `build/openstates/sync-social.js`
- `state:sync:photos` → `build/openstates/sync-photos.js`
- `state:sync:data-sources` → `build/openstates/sync-data-sources.js`

**Note:** Some scripts still correctly reference `build/scripts/state/`:
- `state:sync:voter-registration` (if this script exists)
- `state:sync:google-civic` (if this script exists)
- `state:sync:google-elections` (if this script exists)
- `state:sync:divisions` (if this script exists)

## Files to Verify/Archive

### ⚠️ Need Verification: `archive/src/scripts/state/` Special Scripts
These may still be needed if they provide functionality not in `NEW_civics_ingest/openstates/`:
1. **`sync-divisions.ts`** - Check if divisions sync is handled elsewhere
2. **`sync-google-civic.ts`** - Check if Google Civic sync is handled elsewhere
3. **`sync-google-elections.ts`** - Check if Google Elections sync is handled elsewhere
4. **`sync-voter-registration.ts`** - Check if voter registration sync is handled elsewhere

**Action:** Verify if these are referenced in package.json and if functionality exists in current codebase.

### ⚠️ Potential Duplicates: Archive vs Current
Compare these to ensure archive versions are truly outdated:
- `archive/src/clients/` vs `NEW_civics_ingest/clients/`
- `archive/src/enrich/` vs `NEW_civics_ingest/enrich/`
- `archive/src/persist/` vs `NEW_civics_ingest/persist/`
- `archive/src/utils/` vs `NEW_civics_ingest/utils/`

**Status:** According to `archive/README.md`, essential utilities were copied to `NEW_civics_ingest/`, so archive versions should be safe to keep archived.

## Recommendations

### ✅ Safe to Keep Archived
- All files in `archive/src/scripts/state/` (old sync scripts)
- All files in `archive/src/scripts/openstates/` (old sync scripts)
- All files in `archive/docs-old/` (old documentation)

### ⚠️ Verify Before Removing
- `archive/src/scripts/state/sync-divisions.ts` - Check if still needed
- `archive/src/scripts/state/sync-google-civic.ts` - Check if still needed
- `archive/src/scripts/state/sync-google-elections.ts` - Check if still needed
- `archive/src/scripts/state/sync-voter-registration.ts` - Check if still needed

### 🔧 Fixed
- `package.json` script paths now point to correct `build/openstates/` locations

## Next Steps

1. ✅ **Fixed:** Updated `package.json` script paths
2. ⏳ **Verify:** Check if special sync scripts (divisions, google-civic, etc.) are still needed
3. ⏳ **Test:** Restart syncs with corrected paths
4. ⏳ **Monitor:** Verify syncs work correctly with new paths

---

**Last Updated:** 2026-01-27
