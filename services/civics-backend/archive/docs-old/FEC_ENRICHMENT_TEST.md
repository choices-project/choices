# FEC Enrichment Test Guide

**Purpose:** Verify FEC enrichment works correctly before running mass ingestion.

## Quick Test Options

### Option 1: Comprehensive Test Suite (Recommended)

Runs a full test suite that verifies:
- FEC API connectivity
- Candidate search functionality
- FEC ID coverage in database
- Sample enrichment (2 representatives)
- Database table verification

```bash
cd services/civics-backend
npm run federal:test:finance
```

**What it tests:**
1. ✅ API key presence
2. ✅ FEC API connectivity (tests with known FEC ID: H8ID01124)
3. ✅ Candidate search API
4. ✅ FEC ID coverage check
5. ✅ Sample enrichment on 2 representatives
6. ✅ Database table existence

**Expected output:**
- All tests should pass ✅
- Shows sample data retrieved from FEC API
- Reports FEC ID coverage percentage
- Confirms readiness for mass ingestion

### Option 2: Small Dry-Run Test

Test the enrichment script without making database changes:

```bash
cd services/civics-backend
npm run federal:enrich:finance -- --limit 2 --dry-run
```

**What it does:**
- Fetches 2 representatives with FEC IDs
- Calls FEC API for each
- Shows what would be updated
- **No database changes made**

**Use this to:**
- Verify API calls work
- Check data format
- Test error handling
- Validate cycle parameter

### Option 3: Small Real Test (2 Representatives)

Run actual enrichment on 2 representatives:

```bash
cd services/civics-backend
npm run federal:enrich:finance -- --limit 2
```

**What it does:**
- Fetches 2 representatives
- Calls FEC API
- **Updates database** with finance data
- Shows progress and results

**Use this to:**
- Verify end-to-end flow
- Check database updates work
- Validate data quality scores update
- Test before full run

## Prerequisites

Before running tests, ensure:

1. **FEC API Key is set:**
   ```bash
   echo $FEC_API_KEY
   # Should show your API key
   ```

2. **OpenStates ingestion completed:**
   - FEC IDs come from OpenStates YAML data
   - Run `npm run openstates:ingest` first if needed

3. **Congress.gov enrichment completed (recommended):**
   - Ensures complete representative data
   - Run `npm run federal:enrich:congress` first

4. **Database accessible:**
   - Supabase connection configured
   - `representative_campaign_finance` table exists

## Test Results Interpretation

### ✅ All Tests Pass
- Ready for mass ingestion
- Proceed with: `npm run federal:enrich:finance`

### ⚠️ Some Tests Fail

**API Connectivity Failed:**
- Check `FEC_API_KEY` is set correctly
- Verify API key is valid (sign up at https://api.open.fec.gov/developers/)
- Check network connectivity

**No FEC IDs Found:**
- Run OpenStates ingestion: `npm run openstates:ingest`
- FEC IDs come from OpenStates YAML `other_identifiers` with `scheme: fec`

**Rate Limit Hit:**
- Wait a few minutes and retry
- Consider requesting enhanced API key from APIinfo@fec.gov
- Increase `FEC_THROTTLE_MS` environment variable

**Database Error:**
- Verify `representative_campaign_finance` table exists
- Check Supabase connection
- Review migrations applied

## Recommended Test Sequence

1. **Run comprehensive test:**
   ```bash
   npm run federal:test:finance
   ```

2. **If tests pass, run small dry-run:**
   ```bash
   npm run federal:enrich:finance -- --limit 2 --dry-run
   ```

3. **If dry-run looks good, run small real test:**
   ```bash
   npm run federal:enrich:finance -- --limit 2
   ```

4. **Verify database updates:**
   ```sql
   SELECT r.name, r.fec_id, f.total_raised, f.cycle
   FROM representatives_core r
   LEFT JOIN representative_campaign_finance f ON f.representative_id = r.id
   WHERE r.level = 'federal' AND r.status = 'active'
   LIMIT 5;
   ```

5. **If all looks good, run full enrichment:**
   ```bash
   npm run federal:enrich:finance
   ```

## Troubleshooting

### "FEC_API_KEY not set"
```bash
export FEC_API_KEY=your_api_key_here
# Or add to .env file
```

### "No FEC IDs found"
- FEC IDs come from OpenStates YAML, not Congress.gov
- Run: `npm run openstates:ingest`
- Check: `SELECT COUNT(*) FROM representatives_core WHERE level = 'federal' AND fec_id IS NOT NULL;`

### "Rate limit exceeded"
- Standard key: 1,000 calls/hour
- Wait before retrying
- Request enhanced key: email APIinfo@fec.gov

### "Table does not exist"
- Check migrations applied: `npm run tools:verify:migrations`
- Verify table: `SELECT * FROM representative_campaign_finance LIMIT 1;`

## Next Steps After Successful Test

Once tests pass:

1. **Start with small batch:**
   ```bash
   npm run federal:enrich:finance -- --limit 10
   ```

2. **Monitor for issues:**
   - Watch for rate limits
   - Check error messages
   - Verify data quality

3. **Scale up gradually:**
   ```bash
   npm run federal:enrich:finance -- --limit 50
   npm run federal:enrich:finance -- --limit 100
   ```

4. **Run full enrichment:**
   ```bash
   npm run federal:enrich:finance
   ```

## Files

- **Test script:** `src/scripts/federal/test-fec-enrichment.ts`
- **Enrichment script:** `src/scripts/federal/enrich-fec-finance.ts`
- **FEC client:** `src/clients/fec.ts`
