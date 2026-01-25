# Investigation Summary - Representatives API & Data Status

## Issues Found & Fixed

### 1. ✅ Representatives API 502 Error - FIXED
**Problem**: API was returning 502 Bad Gateway with error:
```
"Could not embed because more than one relationship was found for 'representatives_core' and 'representative_photos'"
```

**Root Cause**: Supabase couldn't determine which foreign key relationship to use when querying related tables.

**Fix**: Explicitly specified foreign key constraint names in the query:
- `representative_photos!fk_representative_photos_representative_id(*)`
- `representative_contacts!fk_representative_contacts_representative_id(*)`
- `representative_social_media!fk_representative_social_media_representative_id(*)`
- `representative_divisions!fk_representative_divisions_representative_id(division_id)`

**Status**: ✅ Fixed and deployed

### 2. ✅ FEC Enrichment Script Paths - FIXED
**Problem**: Scripts were looking for files in `build/scripts/federal/` but TypeScript compiles to `build/federal/`

**Fix**: Updated `package.json` script paths to match actual build output structure.

**Status**: ✅ Fixed

## Current Data Status

### Database Contents
- **Total Active Representatives**: 8,655
  - **Federal**: 547 (all have bioguide_id and congress_gov_id)
  - **State**: 7,928
  - **Local**: 180

### Federal Representative Enrichment Status
- **Total Federal**: 547
- **With FEC ID**: 88 (16%)
- **Missing FEC ID**: 459 (84%)
- **With Bioguide ID**: 547 (100%)
- **With Congress.gov ID**: 547 (100%)

### What's Running
- ✅ FEC Enrichment: Started in background to populate missing FEC IDs and finance data
- ⏳ Congress.gov Enrichment: Already complete (all federal reps have congress_gov_id)
- ⏳ Google Civic Enrichment: May need to run for state/local officials

## Next Steps

1. **Monitor FEC Enrichment**
   - Check `/tmp/fec-enrich.log` for progress
   - Will populate FEC IDs and campaign finance data for 459 federal representatives
   - May hit API rate limits (1,000 requests/hour) - will need to run over multiple days

2. **Verify API is Working**
   - Test: `curl http://localhost:3000/api/representatives?state=CA&limit=5`
   - Should return representative data without 502 errors

3. **Check Other Enrichments**
   - Google Civic enrichment for state/local officials
   - OpenStates sync for state legislators
   - Committee data sync

## API Verification

The API is now working correctly:
```bash
curl "http://localhost:3000/api/representatives?state=CA&limit=1"
# Returns: {"success": true, "data": {"representatives": [...]}}
```

## Files Changed
1. `web/app/api/representatives/route.ts` - Fixed foreign key relationship ambiguity
2. `services/civics-backend/package.json` - Fixed build output paths
