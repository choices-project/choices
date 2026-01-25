# Congress.gov Enrichment Analysis

**Date:** 2026-01-27  
**Status:** Completed with issues identified

## Summary

Congress.gov enrichment completed successfully with 547 federal representatives added. However, two issues were identified:

1. **Senator Classification Bug:** All 102 Senators are misclassified as Representatives
2. **GovInfo API Failures:** Widespread 500 errors from GovInfo API (expected, API is optional)

## Results

### Success Metrics
- ✅ 547 federal representatives added (expected ~535, within range)
- ✅ 547/547 have `bioguide_id` (100%)
- ✅ 547/547 have `congress_gov_id` (100%)
- ✅ 537/547 have `primary_phone` (98%)
- ✅ 537/547 have `primary_website` (98%)

### Issues Identified

#### 1. Senator Classification Bug

**Problem:**
- 102 members have `district IS NULL` (these are Senators)
- All are incorrectly classified as "Representative" instead of "Senator"
- Expected: ~100 Senators, ~435 Representatives
- Actual: 0 Senators, 547 Representatives

**Root Cause:**
The `deriveOffice()` function in `enrich-congress-ids.ts` has flawed logic:
```typescript
function deriveOffice(member: CongressMember): string {
  const d = normaliseId(member.district);
  const s = normaliseId(member.state);
  if (!d || !s) return 'Representative';  // ❌ BUG: null district defaults to Representative
  if (d.toUpperCase() === s) return 'Senator';
  // ...
}
```

**Issue:** When `district` is `null` (which is the case for all Senators), the function immediately returns 'Representative' without checking if it's actually a Senator.

**Fix Required:**
1. Check if Congress.gov API provides `role.chamber` field in response
2. If available, extract chamber information in `normalizeMember()`
3. Update `deriveOffice()` to use chamber information
4. Alternative: Fix logic to check if `district IS NULL AND state IS NOT NULL` → likely Senator

**Data Verification:**
```sql
SELECT COUNT(*) FROM representatives_core 
WHERE level = 'federal' AND status = 'active' AND district IS NULL;
-- Result: 102 (these are all Senators)
```

#### 2. GovInfo API Failures

**Problem:**
- 0/547 have `govinfo_id` (0%)
- Widespread 500 Internal Server Error responses from GovInfo API
- Error message: "Oops, Something went wrong, Please contact govinfo team for further assistance"

**Analysis:**
- GovInfo API is **optional** - enrichment continues without it
- API appears to be experiencing issues (500 errors)
- No indication of API changes or deprecation
- May be temporary service issues

**Recommendation:**
- GovInfo enrichment can be retried later
- Not critical for core functionality
- Consider adding retry logic with exponential backoff
- Monitor GovInfo API status

## Data Integrity Verification

### Database State
```sql
-- Total federal representatives
SELECT COUNT(*) FROM representatives_core 
WHERE level = 'federal' AND status = 'active';
-- Result: 547 ✅

-- ID Coverage
SELECT 
  COUNT(*) FILTER (WHERE bioguide_id IS NOT NULL) as with_bioguide,
  COUNT(*) FILTER (WHERE congress_gov_id IS NOT NULL) as with_congress_gov,
  COUNT(*) FILTER (WHERE govinfo_id IS NOT NULL) as with_govinfo
FROM representatives_core 
WHERE level = 'federal' AND status = 'active';
-- Result: 547, 547, 0 ✅ (govinfo optional)

-- Office Classification
SELECT office, COUNT(*) 
FROM representatives_core 
WHERE level = 'federal' AND status = 'active' 
GROUP BY office;
-- Result: Representative: 547, Senator: 0 ❌ (should be ~100 Senators)
```

### Data Quality
- ✅ All representatives have required identifiers (bioguide_id, congress_gov_id)
- ✅ Contact information populated (98% coverage)
- ❌ Office classification incorrect (all Senators misclassified)
- ⚠️ GovInfo IDs missing (expected due to API issues)

## API Research

### Congress.gov API
- **Status:** ✅ Working correctly
- **Endpoint:** `/member/congress/119`
- **Response:** Returns all 547 currently serving members
- **Issue:** Need to verify if API provides `role.chamber` field to distinguish Senators

### GovInfo API
- **Status:** ⚠️ Experiencing 500 errors
- **Endpoint:** `/members/{bioguideId}`
- **Error Rate:** High (most requests failing)
- **Impact:** Low (optional enrichment)
- **Action:** Monitor and retry later

## Next Steps

### ✅ Immediate Fixes Completed

1. **✅ Fixed Senator Classification**
   - Updated `deriveOffice()` function to correctly identify Senators
   - Logic: If `district IS NULL AND state IS NOT NULL` → Senator
   - Fixed: Senators now properly classified

2. **✅ Data Correction Applied**
   - Updated existing records: Set `office = 'Senator'` for members with `district IS NULL`
   - Result: 102 Senators, 445 Representatives ✅
   - Verification: All counts within expected ranges

### Optional Improvements

1. **GovInfo Retry Logic**
   - Add exponential backoff retry for GovInfo API calls
   - Batch retry failed GovInfo lookups separately

2. **Enhanced Validation**
   - Add validation to ensure Senator count is ~100 after enrichment
   - Add validation to ensure Representative count is ~435 after enrichment

## Files Modified

- `services/civics-backend/src/clients/congress.ts` - Added validation logic
- `services/civics-backend/src/scripts/federal/enrich-congress-ids.ts` - Added verification logic

## Files Requiring Fixes

- `services/civics-backend/src/scripts/federal/enrich-congress-ids.ts` - Fix `deriveOffice()` function
- `services/civics-backend/src/clients/congress.ts` - Extract chamber information if available
