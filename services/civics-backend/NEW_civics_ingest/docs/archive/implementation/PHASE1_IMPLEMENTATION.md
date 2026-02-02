# Phase 1 Implementation: Data Quality & Verification

**Date:** 2026-01-27  
**Status:** ✅ Complete

## Overview

Implemented the three high-priority Phase 1 scripts for data quality automation, duplicate detection, and term date validation. All scripts build on the existing verified schema optimizations.

---

## ✅ Implemented Scripts

### 1. Data Quality Scoring Automation

**Script:** `scripts/tools/update-quality-scores.ts`  
**Command:** `npm run tools:update:quality-scores`

**Features:**
- Calculates quality scores (0-100) based on:
  - **Completeness (40 points):** Contacts, photos, social media, finance data
  - **Identifier coverage (30 points):** OpenStates ID, Bioguide ID, FEC ID, Canonical ID
  - **Verification status (10 points):** Verified, pending, or failed
  - **Freshness (20 points):** Finance cycle recency or last update date
- Updates `data_quality_score` column (uses existing schema constraint 0-100)
- Supports filtering by status and limiting results
- Dry-run mode for testing

**Usage:**
```bash
# Update all active representatives
npm run tools:update:quality-scores

# Dry run (preview changes)
npm run tools:update:quality-scores -- --dry-run

# Limit to 100 representatives
npm run tools:update:quality-scores -- --limit=100

# Update inactive representatives
npm run tools:update:quality-scores -- --status=inactive
```

---

### 2. Duplicate Detection

**Script:** `scripts/tools/audit-duplicates.ts`  
**Command:** `npm run tools:audit:duplicates`

**Features:**
- Detects duplicates by identifier:
  - `openstates_id` (unique partial index)
  - `bioguide_id` (unique partial index, federal only)
  - `fec_id`
  - `canonical_id` (unique partial index)
- Detects name similarity duplicates (same last name + state + office)
- Leverages existing unique constraints
- Auto-fix mode to merge duplicates (keeps first active, marks others as historical)
- Dry-run mode for testing

**Usage:**
```bash
# Audit for duplicates (report only)
npm run tools:audit:duplicates

# Dry run with fix preview
npm run tools:audit:duplicates -- --fix --dry-run

# Auto-fix duplicates
npm run tools:audit:duplicates -- --fix

# Limit results
npm run tools:audit:duplicates -- --limit=50
```

**Fix Behavior:**
- Keeps the first active representative
- Marks duplicates as `status = 'historical'`
- Sets `replaced_by_id` to point to the kept representative
- Adds `status_reason` explaining the merge

---

### 3. Term Date Validation

**Script:** `scripts/tools/validate-term-dates.ts`  
**Command:** `npm run tools:validate:term-dates`

**Features:**
- Validates term dates using existing check constraints:
  - `chk_representatives_core_term_dates` (term_end >= term_start)
  - `chk_representatives_core_next_election` (next_election >= CURRENT_DATE)
- Checks for:
  - Missing term dates for active representatives
  - Term ended but still active (auto-fix available)
  - Missing next_election_date for federal representatives
  - next_election_date in the past
  - Invalid term date relationships
- Auto-fix mode to correct issues where possible
- Dry-run mode for testing

**Usage:**
```bash
# Validate term dates (report only)
npm run tools:validate:term-dates

# Dry run with fix preview
npm run tools:validate:term-dates -- --fix --dry-run

# Auto-fix issues
npm run tools:validate:term-dates -- --fix

# Limit results
npm run tools:validate:term-dates -- --limit=100
```

**Fix Behavior:**
- Marks representatives as `status = 'historical'` if term has ended
- Sets `status_reason` explaining the change
- Updates `status_changed_at` timestamp

---

## Schema Compatibility

✅ **All scripts are fully compatible with existing schema:**
- Uses existing `data_quality_score` column (0-100 constraint)
- Leverages existing unique constraints on identifiers
- Uses existing check constraints for term dates
- Works with existing `status` ENUM (active, inactive, historical)
- Updates `replaced_by_id`, `status_reason`, `status_changed_at` columns

**No schema changes required.**

---

## Integration with Existing Tools

These scripts complement existing tools:

- `tools:report:duplicates` - Existing duplicate reporting (now enhanced)
- `tools:audit:terms` - Existing term auditing (now enhanced)
- `tools:inspect:schema` - Schema verification
- `ingest:qa` - Quality assurance pipeline

**Recommended workflow:**
```bash
# Run full QA pipeline
npm run ingest:qa

# Update quality scores
npm run tools:update:quality-scores

# Audit for duplicates
npm run tools:audit:duplicates -- --fix

# Validate term dates
npm run tools:validate:term-dates -- --fix
```

---

## Testing

All scripts support:
- `--dry-run` - Preview changes without applying
- `--limit=N` - Limit processing to N representatives
- `--fix` - Auto-fix mode (where applicable)
- `--status=active|inactive|historical` - Filter by status

**Recommended testing:**
```bash
# Test with dry-run first
npm run tools:update:quality-scores -- --dry-run --limit=10
npm run tools:audit:duplicates -- --dry-run --limit=10
npm run tools:validate:term-dates -- --dry-run --limit=10

# Then run on full dataset
npm run tools:update:quality-scores
npm run tools:audit:duplicates -- --fix
npm run tools:validate:term-dates -- --fix
```

---

## Next Steps

**Phase 1 Complete ✅**

Proceed to Phase 2:
- Staging/merge fixtures (mock Supabase)
- CLI smoke-test template
- Crosswalk verification

See `REMAINING_WORK.md` for full roadmap.

---

## Files Created

- ✅ `scripts/tools/update-quality-scores.ts`
- ✅ `scripts/tools/audit-duplicates.ts`
- ✅ `scripts/tools/validate-term-dates.ts`
- ✅ `package.json` - Added npm scripts

## Files Updated

- ✅ `package.json` - Added three new `tools:*` scripts

---

**Status:** All Phase 1 scripts implemented, tested, and ready for use.
