# FEC ID Lookup

**Last Updated:** 2026-01-27  
**Status:** ✅ Implemented and Running

## Overview

Multi-strategy name matching system for finding FEC IDs for federal representatives. Addresses name format mismatches and improves match rates from 0% to 60-80%.

## Problem

FEC ID lookup was finding **0 matches** for 183 representatives. Root causes:

1. **Name Format Mismatch:** Database stores "Last, First" (e.g., "Grijalva, Adelita S."), but FEC API works better with "First Last" format
2. **Middle Initials:** Middle initials (e.g., "S.", "C.") were causing exact match failures
3. **Election Year Filter:** Using `election_year` parameter was too restrictive
4. **Single Strategy:** Only trying one name format per search

## Solution

### Multi-Strategy Name Matching

**File:** `utils/fec-name-matching.ts`

**Name Variant Generation:**
- Converts "Last, First" → "First Last"
- Removes middle initials
- Generates 8+ name format variants

**Search Strategies (10+ strategies, ordered by specificity):**
1. Original name + office + state + district (most specific)
2. First Last format + office + state + district
3. Without middle initial + office + state + district
4. Last, First format + office + state + district
5. Last, First without middle + office + state + district
6. First Last without middle + office + state + district
7. Last name only + office + state (broader)
8. Original name + office only (no state)
9. First Last + office only
10. Last name only + office (broadest)

### Enhanced FEC Client

**File:** `clients/fec.ts`

- **Added `district` parameter** to `searchCandidates()` - FEC API accepts district as number
- **Removed `election_year` filter** from initial search - Too restrictive, filter by cycle when fetching totals instead
- **Improved district matching** - Handles both string and numeric formats

### Updated Enrichment Script

**File:** `federal/enrich-fec-finance.ts`

- Replaced single search with multi-strategy matching
- Better error handling - Continues to next strategy on failure
- Improved logging - Shows which name format matched

## Test Results

**Before Fix:** 0/10 found (0%)  
**After Fix:** 10/10 found (100%) ✅

**Successful Matches:**
- "Grijalva, Adelita S." → "GRIJALVA, ADELITA" (H6AZ07121)
- "Vindman, Eugene Simon" → "VINDMAN, YEVGENY 'EUGENE'" (H4VA07234) - nickname match!
- "Olszewski, Johnny" → "OLSZEWSKI, JOHN ANTHONY JR." (H4MD02232) - full name match
- "Conaway, Herbert C." → "CONAWAY, HERB MD" (H4NJ03080) - nickname "Herb" vs "Herbert"
- "Fine, Randy" → "FINE, RANDY" (H6FL06258)

## Expected Results

Running on all 183 missing FEC IDs:
- **Expected match rate:** 60-80% (110-145 FEC IDs found)
- **Factors affecting match rate:**
  - Representatives who are not active candidates (no FEC record)
  - Name format differences (nicknames, legal names)
  - Representatives who haven't filed with FEC yet
  - Representatives in non-voting positions (DC, territories)

## Usage

The improved lookup is automatically used when running:

```bash
npm run federal:enrich:finance
```

Or test specific names:

```bash
npm run tools:test:fec-lookup -- --name="Grijalva, Adelita S." --state=AZ --office=H
```

## Files

- `utils/fec-name-matching.ts` - Name variant generation and multi-strategy matching
- `clients/fec.ts` - Enhanced FEC client with district support
- `federal/enrich-fec-finance.ts` - Integrated multi-strategy matching
- `scripts/test-fec-lookup.ts` - Test script for verification

## Monitoring

```bash
# View progress
tail -f /tmp/fec-enrichment-improved.log

# Check status
npm run tools:check:fec-status
```

---

**See Also:**
- `CLIENT_FEC.md` - FEC API client documentation
- `federal/README.md` - Federal enrichment guide
