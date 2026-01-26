# Archived Documentation

This directory contains documentation that has been superseded by newer tools and processes.

## Archived Files

### UPDATE_STRATEGY.md
**Status:** Superseded by new tools  
**Reason:** Update strategies are now automated via:
- Data quality tools (`tools:update:quality-scores`)
- Duplicate detection (`tools:audit:duplicates`)
- Term validation (`tools:validate:term-dates`)
- Crosswalk verification (`tools:verify:crosswalk`)

**Replacement:** See `PHASE1_IMPLEMENTATION.md`, `PHASE2_IMPLEMENTATION.md`, and `REMAINING_WORK.md`

### UPDATE_VERIFICATION.md
**Status:** Superseded by new tools  
**Reason:** Verification is now automated via:
- CLI smoke test (`tools:smoke-test`)
- Metrics dashboard (`tools:metrics:dashboard`)
- Crosswalk verification (`tools:verify:crosswalk`)

**Replacement:** See `PHASE2_IMPLEMENTATION.md` and `tools:smoke-test` script

---

**Note:** These files are kept for historical reference but should not be used for current operations.
