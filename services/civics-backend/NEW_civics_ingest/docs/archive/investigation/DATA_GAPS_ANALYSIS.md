# Data Gaps Analysis & API Implementation Plan

**Generated:** 2026-01-27  
**Status:** Analysis complete, APIs in progress

## Executive Summary

The database has **8,655 active representatives** with good baseline coverage (contacts: 95.3%, photos: 90.5%), but critical gaps exist in:
- **Committees: 0% coverage** (0 records)
- **Activity: 1.6% coverage** (136 reps with activity)
- **Finance: 6.1% coverage** (532 reps)
- **Social: 13.1% coverage** (1,132 reps)

## Current Database State

### Representative Counts
- **Total:** 8,655 (all active)
- **By Level:**
  - Federal: 547
  - State: 7,928
  - Local: 180

### Identifier Coverage
- **OpenStates ID:** 8,108/8,655 (93.7%) ✅
- **Bioguide ID:** 1,086/8,655 (12.5%) - Expected for federal only
- **FEC ID:** 1,012/8,655 (11.7%) - Needs improvement
- **Canonical ID:** 8,655/8,655 (100%) ✅

### Data Coverage by Table

| Table | Records | Reps Covered | Coverage % | Status |
|-------|---------|--------------|------------|--------|
| Contacts | 16,684 | 8,247 | 95.3% | ✅ Good |
| Photos | 7,832 | 7,832 | 90.5% | ✅ Good |
| Social Media | 2,109 | 1,132 | 13.1% | ⚠️ Needs work |
| Finance | 532 | 532 | 6.1% | 🔴 Critical |
| Activity | 580 | 136 | 1.6% | 🔴 Critical |
| Committees | 0 | 0 | 0.0% | 🔴 Critical |

## Critical Gaps Identified

### 1. Committees (0% coverage) 🔴
**Impact:** No committee membership data available  
**Root Cause:** Committees sync not yet executed  
**Solution:** Create API to trigger `ingest-committees-events.ts` or `enrich/committees.ts`  
**Priority:** **HIGHEST**

### 2. Activity (1.6% coverage) 🔴
**Impact:** Minimal bill sponsorship/voting data  
**Root Cause:** Activity sync is rate-limited and may be incomplete  
**Solution:** Create API wrapper for `workflows/activity-sync.ts` with resume capability  
**Priority:** **HIGHEST**

### 3. Finance (6.1% coverage) 🔴
**Impact:** Limited campaign finance data  
**Root Cause:** FEC enrichment may be incomplete or needs re-run  
**Solution:** Create API wrapper for `federal/enrich-fec-finance.ts`  
**Priority:** **HIGH**

### 4. Social Media (13.1% coverage) ⚠️
**Impact:** Incomplete social media profiles  
**Root Cause:** Social sync may be incomplete  
**Solution:** Create API wrapper for social media sync  
**Priority:** **MEDIUM**

## API Routes to Create

### Priority 1: Critical Data Gaps

1. **`POST /api/admin/civics/ingest/committees`**
   - Trigger committees ingestion
   - Support state/federal filtering
   - Return progress/job ID

2. **`POST /api/admin/civics/ingest/activity`**
   - Trigger activity sync
   - Support resume from checkpoint
   - Rate limit aware
   - Return progress/job ID

3. **`POST /api/admin/civics/ingest/finance`**
   - Trigger FEC finance enrichment
   - Support filtering by state/level
   - Return progress/job ID

### Priority 2: Baseline & Enrichment

4. **`POST /api/admin/civics/ingest/openstates-people`**
   - Trigger OpenStates YAML baseline ingest
   - Support state filtering
   - Return progress/job ID

5. **`POST /api/admin/civics/ingest/fec-ids`**
   - Trigger FEC ID lookup/enrichment
   - Return progress/job ID

6. **`POST /api/admin/civics/ingest/social`**
   - Trigger social media sync
   - Return progress/job ID

### Priority 3: Status & Monitoring

7. **`GET /api/admin/civics/ingest/status`**
   - Get status of all ingest operations
   - Show progress, checkpoints, errors

8. **`GET /api/admin/civics/ingest/status/:jobId`**
   - Get status of specific job
   - Show detailed progress

## Implementation Plan

### Phase 1: Critical APIs (Week 1)
- [ ] Committees ingest API
- [ ] Activity sync API
- [ ] Finance enrichment API
- [ ] Status endpoint

### Phase 2: Baseline APIs (Week 2)
- [ ] OpenStates people ingest API
- [ ] FEC ID enrichment API
- [ ] Social media sync API

### Phase 3: Monitoring & Polish (Week 3)
- [ ] Job status tracking
- [ ] Error handling & retries
- [ ] Rate limit management
- [ ] Documentation

## Technical Notes

### Existing Scripts to Wrap
- `scripts/ingest-committees-events.ts` - Committees ingestion
- `workflows/activity-sync.ts` - Activity sync with checkpoints
- `federal/enrich-fec-finance.ts` - FEC finance enrichment
- `federal/enrich-congress-ids.ts` - Congress ID enrichment
- `ingest/openstates/people.ts` - OpenStates YAML baseline

### Checkpoint System
- Activity sync already supports checkpoints via `utils/checkpoint.ts`
- Other syncs may need checkpoint integration

### Rate Limits
- OpenStates: 10,000 requests/day
- FEC: Check API documentation
- Congress.gov: Check API documentation

## Next Steps

1. ✅ **Complete:** Data gap analysis
2. 🔄 **In Progress:** Create API routes for critical gaps
3. ⏳ **Pending:** Test APIs with real data
4. ⏳ **Pending:** Monitor and iterate

---

**Last Updated:** 2026-01-27
