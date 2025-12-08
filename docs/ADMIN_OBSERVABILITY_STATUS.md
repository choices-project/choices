# Admin Observability Status

**Date:** November 30, 2025  
**Status:** Partially Complete

## Overview

Admin observability features for audit logs, field-level revert, and diff visualization.

## Completed Items ✅

### 1. Audit API Endpoints ✅

**Status:** Endpoints implemented and rate-limited

**Endpoints:**
- ✅ `/api/admin/audit/candidates` - GET endpoint for candidate audit logs
- ✅ `/api/admin/audit/representatives` - GET endpoint for representative audit logs
- ✅ `/api/admin/audit/revert` - POST endpoint for field-level revert

**Features:**
- ✅ Rate limiting (30 requests per 5 minutes)
- ✅ Admin key authentication
- ✅ Pagination support (limit/offset)
- ✅ Filtering by representative ID (representatives endpoint)
- ✅ Field-level revert support (candidate and representative)

**Files:**
- `web/app/api/admin/audit/candidates/route.ts`
- `web/app/api/admin/audit/representatives/route.ts`
- `web/app/api/admin/audit/revert/route.ts`

### 2. Field-Level Revert ✅

**Status:** Backend implementation complete

**Features:**
- ✅ Revert individual field changes
- ✅ Support for candidate and representative audits
- ✅ Validates audit row exists before revert
- ✅ Updates target table with old value
- ✅ Zod validation for request body
- ✅ Strict rate limiting (10 per minute)

**Implementation:**
- Revert endpoint accepts `type` ('candidate' or 'representative') and `id` (audit row ID)
- Fetches audit row to get field name and old value
- Updates the target table (candidate_profiles or representative_overrides) with old value

### 3. Stats Endpoint ✅

**Status:** Endpoint implemented and rate-limited

**Endpoint:**
- ✅ `/api/admin/candidates/stats` - GET endpoint for candidate statistics

**Features:**
- ✅ Rate limiting (30 requests per 5 minutes)
- ✅ Admin key authentication
- ✅ Returns total, public, fast-track linked counts
- ✅ Returns status breakdown

## Remaining Items

### 1. Admin UI Integration

**Status:** UI component exists but uses mock data

**Current State:**
- `web/features/admin/components/AuditLogs.tsx` exists
- Uses mock data instead of real API endpoints
- Needs integration with `/api/admin/audit/candidates` and `/api/admin/audit/representatives`

**Required Changes:**
1. Replace mock data with API calls
2. Add loading states
3. Add error handling
4. Add pagination controls
5. Add filtering UI (by representative ID, date range, etc.)

### 2. Diff Visualization

**Status:** Not implemented

**Required Features:**
- Visual diff display showing old vs new values
- Side-by-side comparison
- Highlighting of changes
- Field name display
- Timestamp and user information

**Implementation Notes:**
- Audit endpoints already return `old_value` and `new_value`
- Need UI component to render diffs
- Consider using a diff library (e.g., `react-diff-viewer`)

### 3. Enhanced Field-Level Revert UI

**Status:** Backend complete, UI needs enhancement

**Current State:**
- Revert endpoint works via API
- No UI for triggering reverts
- No confirmation dialogs
- No success/error feedback

**Required Features:**
1. Revert button in audit log UI
2. Confirmation dialog before revert
3. Success/error toast notifications
4. Refresh audit log after revert
5. Visual indication of reverted items

## Implementation Plan

### Phase 1: Basic UI Integration (High Priority)

1. **Update AuditLogs Component**
   - Replace mock data with API calls to `/api/admin/audit/candidates`
   - Add loading and error states
   - Display real audit data

2. **Add Pagination**
   - Implement limit/offset pagination
   - Add "Load More" or page controls

3. **Add Basic Revert UI**
   - Add revert button to each audit row
   - Call `/api/admin/audit/revert` endpoint
   - Show success/error feedback

### Phase 2: Enhanced Features (Medium Priority)

1. **Diff Visualization**
   - Add diff viewer component
   - Show old vs new values side-by-side
   - Highlight changes

2. **Filtering**
   - Add filter by date range
   - Add filter by field name
   - Add filter by user ID
   - Add filter by representative ID (for representatives endpoint)

3. **Enhanced Revert UI**
   - Confirmation dialog with field details
   - Preview of what will be reverted
   - Batch revert support (future)

### Phase 3: Advanced Features (Low Priority)

1. **Audit Log Search**
   - Full-text search
   - Advanced filters
   - Export functionality

2. **Audit Analytics**
   - Most changed fields
   - Most active users
   - Change frequency charts

## API Usage Examples

### Get Candidate Audit Logs

```typescript
const response = await fetch('/api/admin/audit/candidates?limit=50&offset=0', {
  headers: {
    'x-admin-key': ADMIN_MONITORING_KEY,
  },
});

const data = await response.json();
// { items: [...], limit: 50, offset: 0 }
```

### Get Representative Audit Logs

```typescript
const response = await fetch('/api/admin/audit/representatives?limit=50&offset=0&representativeId=123', {
  headers: {
    'x-admin-key': ADMIN_MONITORING_KEY,
  },
});

const data = await response.json();
// { items: [...], limit: 50, offset: 0 }
```

### Revert Field Change

```typescript
const response = await fetch('/api/admin/audit/revert', {
  method: 'POST',
  headers: {
    'x-admin-key': ADMIN_MONITORING_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'candidate', // or 'representative'
    id: 'audit-row-id',
  }),
});

const data = await response.json();
// { ok: true }
```

## Related Documentation

- `docs/ROADMAP_SINGLE_SOURCE.md` - Main roadmap
- `docs/RATE_LIMITING_AUDIT.md` - Rate limiting audit
- `web/app/api/admin/audit/candidates/route.ts` - Candidates audit endpoint
- `web/app/api/admin/audit/representatives/route.ts` - Representatives audit endpoint
- `web/app/api/admin/audit/revert/route.ts` - Revert endpoint
- `web/features/admin/components/AuditLogs.tsx` - Admin UI component

