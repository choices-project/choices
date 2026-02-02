# Optimization Opportunities

**Last Updated:** 2026-01-27

## Overview

This document identifies optimization opportunities for the civics ingest service, including fixes for known issues and performance improvements.

## Fixed Issues

### 1. Social Media Null Handle Constraint Violation ✅

**Problem:** Social media sync was failing with "null value in column 'handle' violates not-null constraint" errors.

**Root Cause:** Some social media records had URLs but no handles, and the database schema requires `handle` to be NOT NULL.

**Fix:** Enhanced filtering in `persist/social.ts` to:
- Extract handles from URLs when handle is missing (legitimate - handles are in the URL path)
- Skip records entirely if no handle can be extracted (no fake data)
- Only insert records with legitimate handles

**Impact:** Eliminates constraint violation errors during social media sync.

### 2. Events Sync Jurisdiction Parameter Issue ✅

**Problem:** Events sync was failing with "must provide 'jurisdiction' parameter" error when no states were specified.

**Root Cause:** OpenStates API requires a jurisdiction parameter, but the code was passing `undefined` when no jurisdictions were found.

**Fix:** Added validation in `openstates/sync-events.ts` to:
- Check if jurisdictions are available before attempting fetch
- Provide clear warning message when no jurisdictions found
- Require `--states` parameter or skip gracefully

**Impact:** Prevents API errors and provides clear guidance to users.

### 3. Committees Sync Rate Limit Handling ✅

**Problem:** Committees sync had no checkpoint/resume capability, making it vulnerable to rate limits and interruptions.

**Root Cause:** Unlike activity sync, committees sync didn't implement checkpoint system.

**Fix:** Added checkpoint support to `openstates/sync-committees.ts`:
- Checkpoint saving every 50 representatives
- Resume capability via `--resume` flag
- Progress tracking and API usage monitoring
- Automatic checkpoint cleanup on completion

**Impact:** Enables graceful handling of rate limits and interruptions.

## Optimization Opportunities

### 1. Batch Processing

**Current State:** Most syncs process representatives one at a time.

**Opportunity:** Implement batch processing for:
- Social media sync (batch inserts)
- Contacts sync (batch upserts)
- Photos sync (batch operations)

**Expected Impact:** 5-10x faster for bulk operations, reduced database round trips.

**Implementation:**
```typescript
// Example: Batch social media inserts
const batches = chunk(rows, 100);
for (const batch of batches) {
  await client.from('representative_social_media').insert(batch);
}
```

### 2. Parallel Processing with Concurrency Limits

**Current State:** Sequential processing of representatives.

**Opportunity:** Process multiple representatives in parallel with concurrency limits:
- Activity sync: 5-10 concurrent requests
- Committees sync: 3-5 concurrent requests (rate limit aware)
- Social/contacts/photos: 10-20 concurrent (no API limits)

**Expected Impact:** 3-5x faster for API-based syncs, better resource utilization.

**Implementation:**
```typescript
import pLimit from 'p-limit';
const limit = pLimit(5); // Max 5 concurrent

await Promise.all(
  eligible.map(rep => limit(() => syncRepresentative(rep)))
);
```

### 3. Caching and Deduplication

**Current State:** Some data is fetched repeatedly.

**Opportunity:** Implement caching for:
- Committee data (cache by jurisdiction)
- Event data (cache by date range)
- Representative lookups (cache by openstates_id)

**Expected Impact:** Reduced API calls, faster syncs, better rate limit management.

### 4. Smart Retry Logic

**Current State:** Basic retry logic in OpenStates client.

**Opportunity:** Enhanced retry with:
- Exponential backoff
- Rate limit detection (429 errors)
- Circuit breaker pattern
- Retry queue for failed items

**Expected Impact:** Better handling of transient failures, reduced manual intervention.

### 5. Database Query Optimization

**Current State:** Some queries could be optimized.

**Opportunity:** 
- Use batch queries instead of individual lookups
- Add indexes for common query patterns
- Use materialized views for complex aggregations

**Expected Impact:** Faster database operations, reduced load.

### 6. Progress Reporting and Monitoring

**Current State:** Basic progress reporting.

**Opportunity:** Enhanced monitoring:
- Real-time progress dashboard
- ETA calculations
- Performance metrics
- Error rate tracking

**Expected Impact:** Better visibility, easier troubleshooting.

## Implementation Priority

### High Priority (Immediate)
1. ✅ Social media null handle fix
2. ✅ Events sync jurisdiction fix
3. ✅ Committees sync checkpoint support

### Medium Priority (Next Sprint)
1. Batch processing for social/contacts/photos
2. Parallel processing with concurrency limits
3. Enhanced retry logic

### Low Priority (Future)
1. Caching layer
2. Database query optimization
3. Advanced monitoring dashboard

## Performance Targets

After optimizations:
- **Activity Sync:** 2-3 hours → 30-45 minutes (with parallel processing)
- **Committees Sync:** 4-6 hours → 1-2 hours (with checkpoints + parallel)
- **Social/Contacts/Photos:** 1-2 hours → 15-30 minutes (with batching)

## Monitoring

Track these metrics:
- Sync duration
- API usage efficiency
- Error rates
- Database query performance
- Memory usage

---

**See Also:**
- `GETTING_STARTED.md` - Service overview
- `INGEST_FLOWS.md` - Data flow documentation
- `SERVICE_STRUCTURE.md` - Architecture details
