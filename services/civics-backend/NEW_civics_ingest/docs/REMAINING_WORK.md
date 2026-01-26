# Remaining Work: Civics Ingest Organization & Optimization

**Last Updated:** 2026-01-27  
**Status:** Prioritized roadmap for remaining improvements  
**Schema Status:** ✅ All optimizations applied (verified via Supabase MCP)

## Overview

This document outlines remaining work to organize, optimize, and harden the civics ingest system. Work is prioritized by impact and dependencies.

**Note:** This work builds on the existing schema optimizations that have already been applied:
- ✅ Status tracking (`status`, `replaced_by_id`, `status_reason`, `status_changed_at`)
- ✅ Data quality score column (`data_quality_score` with 0-100 constraint)
- ✅ Verification status (`verification_status` with check constraint)
- ✅ Unique constraints on identifiers (openstates_id, bioguide_id, canonical_id)
- ✅ Performance indexes (composite, partial, GIN trigram)
- ✅ Check constraints (state format, level enum, term dates)
- ✅ Foreign key indexes
- ✅ Updated_at triggers

**All schema optimizations from `SCHEMA_OPTIMIZATIONS.md` are in place.**

---

## 🔴 High Priority (Core Functionality)

### 1. Data Quality & Verification

**Status:** Partially implemented, needs automation

**Tasks:**
- [ ] **Automated duplicate detection**
  - Cross-reference identifiers (bioguide_id, openstates_id, fec_id, canonical_id)
  - Leverage existing unique constraints on identifiers:
    - `idx_representatives_core_openstates_id_unique` (partial unique)
    - `idx_representatives_core_bioguide_id_unique` (partial unique, federal only)
    - `idx_representatives_core_canonical_id_unique` (partial unique)
  - Flag potential duplicates based on name similarity + state/office
  - Create `tools:audit:duplicates` script
  - **Impact:** Prevents data corruption, improves data quality
  - **Schema:** ✅ Unique constraints already enforce uniqueness on identifiers

- [ ] **Data quality scoring automation**
  - Update `data_quality_score` (existing column, 0-100 constraint) based on:
    - Completeness (contacts, photos, social media, finance data)
    - Freshness (last update date, stale data flags)
    - Verification status (verified identifiers, cross-references)
  - Use existing `utils/data-quality.ts` function
  - Create `tools:update:quality-scores` script
  - **Impact:** Better data visibility, identifies gaps
  - **Schema:** ✅ Column exists with check constraint (0-100)

- [ ] **Term date validation**
  - Validate `term_start_date`, `term_end_date`, `next_election_date` consistency
  - Leverage existing check constraints:
    - `chk_representatives_core_term_dates` (term_end >= term_start)
    - `chk_representatives_core_next_election` (next_election >= CURRENT_DATE)
  - Flag representatives with missing or invalid term dates
  - Create `tools:validate:term-dates` script
  - **Impact:** Ensures accurate term tracking
  - **Schema:** ✅ Check constraints already enforce term date logic

**Files:**
- `utils/data-quality.ts` (exists, needs enhancement)
- `scripts/tools/audit-duplicates.ts` (create)
- `scripts/tools/update-quality-scores.ts` (create)
- `scripts/tools/validate-term-dates.ts` (create)

---

### 2. Crosswalk & Deduplication Strategy

**Status:** Identifiers captured, dedupe logic needed

**Tasks:**
- [x] **Automated crosswalk verification** ✅
  - Verify all identifiers link correctly (bioguide ↔ openstates ↔ fec ↔ canonical)
  - Flag broken crosswalks
  - Create `tools:verify:crosswalk` script
  - **Impact:** Ensures data integrity across systems
  - **Status:** Implemented and tested

- [ ] **Deduplication automation**
  - Identify representatives with multiple `canonical_id` entries
  - Merge strategy for duplicates
  - Create `tools:dedupe:representatives` script (with dry-run mode)
  - **Impact:** Prevents duplicate records

**Files:**
- `scripts/tools/verify-crosswalk.ts` (create)
- `scripts/tools/dedupe-representatives.ts` (create)

---

### 3. Testing & Validation Harness

**Status:** Unit tests exist, integration tests needed

**Tasks:**
- [ ] **Staging/merge fixtures (mock Supabase)**
  - Create test fixtures for OpenStates YAML data
  - Mock Supabase client for staging/merge operations
  - Unit tests for staging → merge flow
  - **Impact:** Prevents regressions, enables safe refactoring

- [x] **CLI smoke-test template** ✅
  - Live Supabase smoke tests (with env var guards)
  - Verify data integrity after ingest
  - Create `tools:smoke-test` script
  - **Impact:** Catches issues before production
  - **Status:** Implemented and tested

- [ ] **CI ingest smoke test**
  - Fixture-driven tests in CI pipeline
  - Verify ingest scripts work with test data
  - **Impact:** Automated validation on every commit

**Files:**
- `__tests__/fixtures/` (create directory)
- `__tests__/staging.test.ts` (create)
- `__tests__/merge.test.ts` (create)
- `scripts/tools/smoke-test.ts` (create)

---

## 🟡 Medium Priority (Optimization)

### 4. API Call Optimization

**Status:** OpenStates optimized, others need work

**Tasks:**
- [ ] **FEC API optimization**
  - ✅ Multi-strategy name matching (DONE)
  - [ ] Batch requests where possible
  - [ ] Cache candidate lookups
  - [ ] **Impact:** Reduces API calls, faster enrichment

- [ ] **Congress.gov optimization**
  - Review current API usage patterns
  - Implement request batching
  - Add caching for member data
  - **Impact:** Faster federal enrichment

- [ ] **Google Civic API optimization**
  - Batch address lookups
  - Cache district mappings
  - **Impact:** Faster district resolution

**Files:**
- `clients/fec.ts` (enhance)
- `clients/congress.ts` (enhance)
- `clients/google-civic.ts` (enhance)

---

### 5. Resume Capability for Long-Running Syncs

**Status:** ✅ Complete

**Tasks:**
- [x] **Checkpoint system for OpenStates syncs** ✅
  - Save progress (last processed representative ID)
  - Resume from checkpoint on restart
  - Create `tools:resume:sync` script
  - **Impact:** Handles interruptions gracefully
  - **Status:** Implemented and tested

- [ ] **Progress tracking for FEC enrichment**
  - Track which representatives have been enriched
  - Skip already-enriched reps on restart
  - **Impact:** Faster re-runs, handles failures
  - **Status:** Checkpoint system ready, FEC integration pending

**Files:**
- ✅ `workflows/activity-sync.ts` (enhanced with checkpoint support)
- `federal/enrich-fec-finance.ts` (enhance - checkpoint integration pending)
- ✅ `utils/checkpoint.ts` (created)

---

### 6. Metrics & Logging

**Status:** Basic logging exists, metrics needed

**Tasks:**
- [ ] **Structured logging**
  - Processed counts per script
  - Error rates and types
  - API usage statistics
  - Create `utils/logger.ts` with structured output
  - **Impact:** Better observability, easier debugging

- [ ] **Ingestion metrics dashboard**
  - Coverage statistics (FEC IDs, finance data, activity, committees)
  - Data freshness metrics
  - API usage tracking
  - Create `tools:metrics:dashboard` script
  - **Impact:** Visibility into system health

**Files:**
- `utils/logger.ts` (enhance)
- `scripts/tools/metrics-dashboard.ts` (create)

---

## 🟢 Low Priority (Nice to Have)

### 7. Documentation Consolidation

**Status:** Documentation exists but scattered

**Tasks:**
- [ ] **Consolidate client documentation**
  - Merge `CLIENT_*.md` files into single reference
  - Add usage examples for each client
  - **Impact:** Easier onboarding

- [ ] **Create operator runbook**
  - Step-by-step guides for common operations
  - Troubleshooting guide
  - **Impact:** Easier operations

- [ ] **Archive legacy scripts**
  - Identify unused scripts
  - Move to `archive/` directory
  - **Impact:** Cleaner codebase

**Files:**
- `docs/CLIENT_REFERENCE.md` (create)
- `docs/OPERATOR_RUNBOOK.md` (create)

---

### 8. Data Audit & Snapshotting

**Status:** Not implemented

**Tasks:**
- [ ] **Raw YAML snapshot storage**
  - Store hashes of ingested YAML files
  - Enable audit trail
  - **Impact:** Data provenance tracking

- [ ] **Ingestion history**
  - Track when each representative was last updated
  - Identify stale data
  - **Impact:** Data freshness visibility

**Files:**
- `utils/snapshots.ts` (create)
- `scripts/tools/audit-stale-data.ts` (create)

---

### 9. Type Generation & Maintenance

**Status:** Manual process

**Tasks:**
- [ ] **Automated Supabase type regeneration**
  - Script to regenerate types after schema changes
  - Verify types match schema
  - **Impact:** Type safety, prevents drift

- [ ] **Type validation**
  - Ensure TypeScript types match database schema
  - Flag mismatches
  - **Impact:** Prevents runtime errors

**Files:**
- `scripts/tools/regenerate-types.ts` (create)
- `scripts/tools/validate-types.ts` (create)

---

## 📋 Implementation Priority

### Phase 1: Core Quality (Weeks 1-2)
1. ✅ FEC ID lookup improvements (DONE)
2. Data quality scoring automation
3. Duplicate detection
4. Term date validation

### Phase 2: Testing & Verification (Weeks 3-4)
5. Staging/merge fixtures
6. CLI smoke tests
7. Crosswalk verification

### Phase 3: Optimization (Weeks 5-6)
8. API call optimization (Congress, Google Civic)
9. Resume capability
10. Metrics & logging

### Phase 4: Polish (Weeks 7-8)
11. Documentation consolidation
12. Type generation automation
13. Legacy script archival

---

## 🎯 Success Criteria

**System is "organized and optimized" when:**

- ✅ **Data Quality:** Automated quality scoring, duplicate detection, term validation
- ✅ **Testing:** Fixture-driven tests, smoke tests, CI integration
- ✅ **Observability:** Structured logging, metrics dashboard, progress tracking
- ✅ **Reliability:** Resume capability, error handling, checkpoint system
- ✅ **Performance:** Optimized API calls, batching, caching
- ✅ **Documentation:** Consolidated docs, operator runbook, clear examples
- ✅ **Maintainability:** Type safety, automated validation, clean codebase

---

## 📊 Current Status Summary

**Completed:**
- ✅ FEC ID lookup improvements (multi-strategy matching)
- ✅ OpenStates API integration (committees, events, activity)
- ✅ Schema optimizations (all migrations applied - verified via Supabase MCP)
  - ✅ Unique constraints on identifiers
  - ✅ Performance indexes (composite, partial, GIN trigram)
  - ✅ Check constraints (state format, level enum, term dates, data_quality_score)
  - ✅ NOT NULL constraints (name, state, level, status, data_quality_score)
  - ✅ Updated_at triggers (all representative tables)
  - ✅ Foreign key indexes
  - ✅ Status tracking (ENUM, columns, indexes)
  - ✅ Verification status (column with check constraint)
- ✅ Status tracking (active/inactive/historical)
- ✅ Basic status checking tools
- ✅ **Phase 1: Data Quality & Verification** (complete)
  - ✅ Data quality scoring automation
  - ✅ Duplicate detection
  - ✅ Term date validation
- ✅ **Phase 2: Crosswalk Verification & Smoke Testing** (complete)
  - ✅ Crosswalk verification
  - ✅ CLI smoke test
- ✅ **Phase 3: Resume Capability & Metrics** (complete)
  - ✅ Checkpoint system
  - ✅ Structured logging
  - ✅ Resume capability (Activity Sync)
  - ✅ Metrics dashboard

**In Progress:**
- 🔄 OpenStates activity/committees syncs (rate limited, can resume with checkpoints)

**Remaining:**
- ⏳ API optimization (Congress.gov, Google Civic)
- ⏳ FEC enrichment checkpoint integration
- ⏳ Testing harness (staging/merge fixtures)
- ⏳ Documentation consolidation

---

## 🔗 Related Documents

- **Roadmap:** `docs/ROADMAP.md`
- **Ingest Flows:** `docs/INGEST_FLOWS.md`
- **Migration Order:** `docs/MIGRATION_ORDER.md`
- **Schema Optimizations:** `docs/SCHEMA_OPTIMIZATIONS.md`
- **Schema Verification:** `docs/SCHEMA_VERIFICATION.md` (NEW - verified via Supabase MCP)
- **FEC Improvements:** `docs/FEC_ID_LOOKUP_IMPROVEMENTS.md`

---

## ✅ Schema Verification

**All schema optimizations verified via Supabase MCP:**
- ✅ Status tracking columns and ENUM
- ✅ Data quality score column with constraint
- ✅ Verification status column with constraint
- ✅ Unique constraints on identifiers
- ✅ Performance indexes (composite, partial, GIN)
- ✅ Check constraints (state, level, term dates, data quality)
- ✅ Foreign key indexes
- ✅ Updated_at triggers

**See:** `docs/SCHEMA_VERIFICATION.md` for complete verification report.

**No schema conflicts - all remaining work is compatible with existing schema.**

---

**Next Steps:** Start with Phase 1 (Data Quality & Verification) for maximum impact.
