# FEC ID Lookup Improvements

**Date:** 2026-01-26  
**Status:** ✅ Implemented

## Problem

FEC ID lookup was finding 0 matches for 183 representatives missing FEC IDs. The issue was:

1. **Name Format Mismatch:** Our database stores names as "Last, First" (e.g., "Grijalva, Adelita S."), but FEC API may expect "First Last" format
2. **Middle Initials:** Middle initials (e.g., "S.", "C.") were causing exact match failures
3. **Election Year Filter:** Using `election_year` parameter was too restrictive - many candidates don't have that year set
4. **Single Strategy:** Only trying one name format per search

## Solution

### 1. Multi-Strategy Name Matching

Created `utils/fec-name-matching.ts` with:
- **`generateNameVariants()`** - Creates multiple name format variants:
  - Original format
  - "First Last" format (if input is "Last, First")
  - "Last, First" format (if input is "First Last")
  - Without middle initials
  - Last name only
  - First name only

- **`generateSearchStrategies()`** - Creates 10+ search strategies ordered by specificity:
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

- **`findFecCandidateByMultipleStrategies()`** - Tries all strategies until a match is found

### 2. Enhanced FEC Client

- **Added `district` parameter** to `searchCandidates()` - FEC API accepts district as number (1-56 for House)
- **Removed `election_year` filter** from `searchCandidateWithTotals()` - Too restrictive, filter by cycle when fetching totals instead
- **Improved district matching** - Handles both string and numeric district formats

### 3. Updated Enrichment Script

- **Replaced single search** with multi-strategy matching
- **Better error handling** - Continues to next strategy on failure
- **Improved logging** - Shows which name format matched
- **District support** - Uses district information for House members

## Implementation Details

### Name Variant Generation

```typescript
// Input: "Grijalva, Adelita S."
// Output:
{
  original: "Grijalva, Adelita S.",
  lastFirst: "Grijalva, Adelita S.",
  firstLast: "Adelita S. Grijalva",
  lastName: "Grijalva",
  firstName: "Adelita S.",
  withoutMiddleInitial: "Adelita Grijalva",
  lastFirstNoMiddle: "Grijalva, Adelita",
  firstLastNoMiddle: "Adelita Grijalva"
}
```

### Search Strategy Order

Strategies are ordered from most specific to least specific:
1. Most specific (name + office + state + district) - highest precision
2. Less specific (name + office + state) - still good precision
3. Broader (name + office) - may return multiple matches
4. Broadest (last name + office) - fallback

### Matching Logic

1. Try each strategy in order
2. For each strategy, search FEC API
3. If candidates found:
   - If we have office/state/district filters, prefer exact matches
   - Otherwise, return first match
4. Continue to next strategy if no match found

## Testing

Run test script to verify improvements:

```bash
npm run tools:test:fec-lookup
```

Or test specific names:

```bash
npm run tools:test:fec-lookup -- --name="Grijalva, Adelita S." --state=AZ --office=H
```

## Expected Improvements

- **Before:** 0/183 FEC IDs found (0%)
- **After:** Expected 50-80% match rate (90-145 FEC IDs found)

**Factors affecting match rate:**
- Representatives who are not active candidates (no FEC record)
- Name format differences (nicknames, legal names)
- Representatives who haven't filed with FEC yet
- Representatives in non-voting positions

## Usage

The improved lookup is automatically used when running:

```bash
npm run federal:enrich:finance -- --lookup-missing-fec-ids
```

## Next Steps

1. **Run improved lookup** on the 183 missing FEC IDs
2. **Monitor results** - Check how many are found
3. **For remaining unmatched:**
   - Check if they're non-voting delegates (DC, territories)
   - Check if they're newly elected (may not have FEC records yet)
   - Consider manual review for high-profile representatives
   - Consider alternative data sources (Congress.gov, Bioguide)

## Files Changed

- `utils/fec-name-matching.ts` (new) - Name variant generation and multi-strategy matching
- `clients/fec.ts` - Added district parameter, removed election_year filter
- `federal/enrich-fec-finance.ts` - Integrated multi-strategy matching
- `scripts/test-fec-lookup.ts` (new) - Test script for verification
