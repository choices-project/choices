# Status Update: Ingestion & Audit

**Updated:** 2026-01-27  
**Status:** Fixed configuration issues, restarted syncs, audit complete

## ✅ Fixed Issues

### 1. Package.json Script Paths
**Problem:** Scripts referenced non-existent `build/scripts/state/` paths  
**Fixed:** Updated to correct `build/openstates/` paths:
- `state:sync:committees` → `build/openstates/sync-committees.js` ✅
- `state:sync:contacts` → `build/openstates/sync-contacts.js` ✅
- `state:sync:social` → `build/openstates/sync-social.js` ✅
- `state:sync:photos` → `build/openstates/sync-photos.js` ✅
- `state:sync:data-sources` → `build/openstates/sync-data-sources.js` ✅

### 2. Restarted Syncs
- ✅ **Social Sync:** Restarted with correct path - Running
- ✅ **Activity Sync:** Restarted - Running
- ✅ **Committees Sync:** Completed (but needs verification - see below)

## 🔍 Audit Results

### Files Already Archived (Correct) ✅
- `archive/src/scripts/state/` - Old sync scripts (superseded)
- `archive/src/scripts/openstates/` - Old sync scripts (superseded)
- `archive/docs-old/` - Old documentation (superseded)

### Current File Structure (Correct) ✅
- `NEW_civics_ingest/openstates/` - **Current** sync scripts
- All sync scripts properly located and working

### Configuration Issues Fixed ✅
- Package.json paths corrected
- Build output verified

**Full audit report:** See `AUDIT_OUTDATED_FILES.md`

## ⚠️ Issues to Investigate

### Committees Sync - Needs Verification
**Status:** Sync reports "complete" but database shows 0 committees

**Log shows:**
- "Syncing committee assignments for 7801 representatives..."
- "✅ Committees sync complete."
- "✅ Events sync complete."

**Database shows:**
- `representative_committees`: 0 rows

**Possible causes:**
1. Sync ran but no committees found in YAML/API data
2. Persist function may have filtering that excludes all data
3. Data may be written but filtered out by `is_current = true` query

**Action needed:** Investigate `persist/committees.ts` and verify if data is actually being written.

## 📊 Current Sync Status

| Sync | Status | Coverage | Notes |
|------|--------|----------|-------|
| **Social** | 🔄 Running | 13.1% → Target: 100% | Restarted with correct path |
| **Activity** | 🔄 Running | 1.6% → Target: 100% | Restarted, rate limited |
| **Committees** | ⚠️ Needs Verification | 0% → Target: 100% | Sync completed but no data |
| **Finance** | ✅ Complete | 6.1% (533 reps) | Added 1 rep |

## Next Steps

1. ✅ **Fixed:** Package.json script paths
2. ✅ **Completed:** Comprehensive audit
3. ✅ **Restarted:** Social and activity syncs
4. ⏳ **Pending:** Investigate why committees sync didn't populate data
5. ⏳ **Pending:** Monitor running syncs for progress

---

**Last Updated:** 2026-01-27
