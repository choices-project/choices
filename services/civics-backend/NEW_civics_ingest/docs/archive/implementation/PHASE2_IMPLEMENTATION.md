# Phase 2 Implementation: Crosswalk Verification & Smoke Testing

**Date:** 2026-01-27  
**Status:** ✅ Complete

## Overview

Implemented crosswalk verification and CLI smoke-test tools to ensure data integrity. These tools complement Phase 1 scripts and provide comprehensive data validation.

---

## ✅ Implemented Scripts

### 1. Crosswalk Verification

**Script:** `scripts/tools/verify-crosswalk.ts`  
**Command:** `npm run tools:verify:crosswalk`

**Features:**
- Verifies identifier crosswalk integrity:
  - `bioguide_id` ↔ `openstates_id` ↔ `fec_id` ↔ `canonical_id`
- Detects:
  - Multiple representatives sharing same identifier (should be caught by unique constraints)
  - Missing identifier links (e.g., federal rep with bioguide_id but no fec_id)
  - Inconsistent data (same identifier but different related identifiers)
  - Orphaned identifiers
- Provides suggestions for fixes
- Dry-run mode for testing

**Usage:**
```bash
# Verify crosswalk (report only)
npm run tools:verify:crosswalk

# Dry run with fix preview
npm run tools:verify:crosswalk -- --fix --dry-run

# Limit results
npm run tools:verify:crosswalk -- --limit=50
```

**Issue Types:**
- `missing_link` - Representative missing expected identifier
- `inconsistent_data` - Same identifier with conflicting data
- `orphaned_identifier` - Identifier exists but no matching representative

---

### 2. CLI Smoke Test

**Script:** `scripts/tools/smoke-test.ts`  
**Command:** `npm run tools:smoke-test`

**Features:**
- Live Supabase data integrity checks:
  - Representative counts and status distribution
  - Data quality score distribution
  - Identifier coverage (by level: federal vs state/local)
  - Foreign key integrity (replaced_by_id references)
  - Constraint violations (state format, data_quality_score range)
- Environment variable guards (requires live Supabase)
- Quick mode (skips expensive constraint checks)
- Comprehensive reporting with pass/warn/fail status

**Usage:**
```bash
# Full smoke test
npm run tools:smoke-test

# Quick smoke test (skips constraint checks)
npm run tools:smoke-test -- --quick
```

**Test Coverage:**
1. **Representative counts** - Total, active, inactive, historical
2. **Data quality scores** - Average, range, high/low quality counts
3. **Identifier coverage** - OpenStates, Bioguide, FEC, Canonical (by level)
4. **Foreign key integrity** - Orphaned replaced_by_id references
5. **Constraint violations** - Invalid state codes, invalid quality scores

**Output:**
- ✅ Pass - Test passed
- ⚠️  Warn - Test passed with warnings
- ❌ Fail - Test failed (exits with code 1)

---

## Integration with Existing Tools

These scripts complement existing tools:

- `tools:audit:duplicates` - Duplicate detection (now enhanced with crosswalk checks)
- `tools:update:quality-scores` - Quality score updates
- `tools:validate:term-dates` - Term date validation
- `ingest:qa` - Quality assurance pipeline

**Recommended workflow:**
```bash
# Run full QA pipeline
npm run ingest:qa

# Verify crosswalk integrity
npm run tools:verify:crosswalk

# Run smoke test
npm run tools:smoke-test

# Update quality scores
npm run tools:update:quality-scores

# Fix any issues found
npm run tools:audit:duplicates -- --fix
npm run tools:validate:term-dates -- --fix
```

---

## Schema Compatibility

✅ **All scripts are fully compatible with existing schema:**
- Uses existing identifier columns (openstates_id, bioguide_id, fec_id, canonical_id)
- Leverages existing unique constraints
- Works with existing `status` ENUM
- Checks `replaced_by_id` foreign key integrity
- Validates constraint compliance

**No schema changes required.**

---

## Testing

All scripts support:
- `--dry-run` - Preview changes without applying
- `--limit=N` - Limit processing to N representatives
- `--fix` - Auto-fix mode (where applicable)
- `--quick` - Quick mode (smoke-test only, skips expensive checks)

**Recommended testing:**
```bash
# Test crosswalk verification
npm run tools:verify:crosswalk -- --dry-run --limit=10

# Test smoke test
npm run tools:smoke-test -- --quick

# Then run on full dataset
npm run tools:verify:crosswalk
npm run tools:smoke-test
```

---

## Example Output

### Crosswalk Verification
```
🔗 Crosswalk Verification
============================================================

📋 Verifying 1000 representatives with identifiers...

⚠️  Found 5 crosswalk issues:

   missing_link (3):
     - John Doe (ID 123)
       Federal representative has bioguide_id (B000123) but missing fec_id
       💡 Run federal:enrich:finance --lookup-missing-fec-ids

   inconsistent_data (2):
     - Jane Smith (ID 456)
       Multiple representatives share openstates_id: os-123 (2 total)
       💡 Deduplicate using tools:audit:duplicates --fix
```

### Smoke Test
```
🧪 Data Integrity Smoke Test
============================================================

📋 Test Results:
============================================================
✅ Representative counts: Total: 8655, Active: 8655, Inactive: 0, Historical: 0
⚠️  Data quality scores: Avg: 6.9, Range: 0-88, High (≥80): 4, Low (<50): 908
✅ Identifier coverage: OpenStates: 453/1000, Bioguide: 574/1000, FEC: 569/1000
✅ Foreign key integrity: All foreign key references valid

📊 Summary:
   ✅ Pass: 3
   ⚠️  Warn: 1
   ❌ Fail: 0

⚠️  Smoke test passed with warnings.
```

---

## Next Steps

**Phase 2 Complete ✅**

Proceed to Phase 3:
- API call optimization (Congress.gov, Google Civic)
- Resume capability for long-running syncs
- Metrics & logging

See `REMAINING_WORK.md` for full roadmap.

---

## Files Created

- ✅ `scripts/tools/verify-crosswalk.ts`
- ✅ `scripts/tools/smoke-test.ts`
- ✅ `package.json` - Added npm scripts

---

**Status:** All Phase 2 scripts implemented, tested, and ready for use.
