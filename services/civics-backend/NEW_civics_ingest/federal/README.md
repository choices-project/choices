# Federal Enrichment - Verified Working

**Status:** ✅ Complete and verified

## Overview

This directory contains verified working code for federal representative enrichment using Congress.gov and GovInfo APIs.

## Files

### Scripts
- **`enrich-congress-ids.ts`** - Main enrichment script
  - Adds new federal representatives from Congress.gov
  - Deactivates representatives no longer in office
  - Hydrates Congress.gov and GovInfo IDs
  - ✅ Fixed Senator classification bug
  - ✅ Includes validation and verification logic

### Clients
- **`../clients/congress.ts`** - Congress.gov API client
  - Fetches current Congress members (119th Congress)
  - Includes member count validation
  - ✅ Verified: Returns all 547 currently serving members

- **`../clients/govinfo.ts`** - GovInfo API client
  - Fetches GovInfo member data by bioguide ID
  - ⚠️ Currently experiencing 500 errors (API issues)
  - Optional enrichment - script continues without it

## Results

### Congress.gov Enrichment (Complete ✅)
- **547 federal representatives** added
- **102 Senators** (correctly classified)
- **445 Representatives** (correctly classified)
- **100% coverage:** All have `bioguide_id` and `congress_gov_id`
- **98% coverage:** 537/547 have `primary_phone` and `primary_website`

### GovInfo Enrichment (Pending ⚠️)
- **0/547 have `govinfo_id`** (API experiencing 500 errors)
- **Status:** Optional enrichment, can retry later
- **Note:** GovInfo MCP server available for future document access

## Usage

```bash
cd services/civics-backend
npm run federal:enrich:congress
```

## Key Features

1. **Member Count Validation**
   - Validates API returns expected ~535 members (500-550 range)
   - Logs warnings if outside expected range

2. **Senator Classification**
   - ✅ Fixed: Correctly identifies Senators (null district + state)
   - Handles edge cases (At-Large representatives, territories)

3. **Post-Enrichment Verification**
   - Validates Senator count (~100)
   - Validates Representative count (~435)
   - Logs warnings if counts outside expected ranges

4. **Status Management**
   - Uses `status = 'active'` for filtering
   - Uses `update_representative_status()` RPC for deactivation
   - Sets `verification_status = 'pending'` for new reps

## Documentation

See `../docs/` for:
- `CONGRESS_ENRICHMENT_ANALYSIS.md` - Detailed analysis
- `CONGRESS_ENRICHMENT_FINAL_STATUS.md` - Final status and verification
- `GOVINFO_MCP_BENEFITS_ANALYSIS.md` - MCP evaluation
- `GOVINFO_MCP_SETUP.md` - MCP server setup guide

## FEC Enrichment (Ready ✅)

### Overview
- **Script:** `enrich-fec-finance.ts` (optimized and enhanced)
- **Client:** `../clients/fec.ts` (with retry logic and candidate search)
- **FEC ID Source:** OpenStates YAML data (`other_identifiers` with `scheme: fec`)
- **Note:** FEC IDs do NOT come from Congress.gov - they come from OpenStates ingestion

### Features
- ✅ Pre-enrichment FEC ID coverage check
- ✅ Optional FEC ID lookup fallback (`--lookup-missing-fec-ids`)
- ✅ Progress reporting with ETA
- ✅ Post-enrichment verification
- ✅ Retry logic with exponential backoff
- ✅ Enhanced error handling and rate limit detection
- ✅ Summary statistics and coverage validation

### Usage
```bash
cd services/civics-backend
npm run federal:enrich:finance

# Options:
# --limit 10              # Limit to 10 representatives
# --cycle 2024            # Use specific cycle (default: current even year)
# --state CA,TX           # Filter by states
# --lookup-missing-fec-ids # Attempt to find missing FEC IDs via API
# --dry-run               # Test without database updates
```

### FEC API Details
- **Base URL:** `https://api.open.fec.gov/v1`
- **Rate Limits:**
  - Standard key: 1,000 calls/hour
  - Enhanced key: 7,200 calls/hour (request from APIinfo@fec.gov)
- **Throttle:** 1200ms between requests (configurable via `FEC_THROTTLE_MS`)

### Expected Results
- **Coverage:** ~80-90% of active federal reps with FEC IDs should have finance data
- **Data:** Total raised, total spent, cash on hand, top contributors, small donor percentage
- **Cycle:** Uses current even year (e.g., 2024 for 2024-2025 cycle)

### Test Scripts
- **`test-fec-enrichment.ts`** - Comprehensive test suite
- **`test-fec-cycles.ts`** - Test cycle data availability
- **`monitor-fec-enrichment.ts`** - Monitor enrichment progress

### Documentation
- **`../docs/FEC_ENRICHMENT_TEST.md`** - Test guide and troubleshooting
- **`../docs/FEC_ENRICHMENT_DATA_VERIFICATION.md`** - Data verification results

## Next Steps

- [ ] Run FEC enrichment for current cycle
- [ ] Retry GovInfo enrichment when API stabilizes
- [ ] Evaluate GovInfo MCP for document access features
