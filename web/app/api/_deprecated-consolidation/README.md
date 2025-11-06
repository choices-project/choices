# Deprecated API Endpoints - Consolidation November 2025

**Date Deprecated**: November 5, 2025  
**Reason**: API consolidation to eliminate duplication  
**Total Deprecated**: 32 endpoints (22% of API surface)

---

## Why These Were Deprecated

This directory contains API endpoints that were duplicates or had overlapping functionality. They have been consolidated to:

1. **Reduce API surface area** - Easier to maintain
2. **Improve consistency** - Clear naming patterns
3. **Better organization** - Logical endpoint grouping
4. **Version control** - `/v1/` prefix for versioned APIs

---

## Consolidation Strategy

### Civics Endpoints (8 deprecated)
- Old: `/api/civics/*` → New: `/api/v1/civics/*` (versioned)
- Old: `/api/civic-actions` → New: `/api/civics/actions` (consistent naming)

### Profile/User Endpoints (6 deprecated)
- Old: `/api/user/profile` → New: `/api/profile` (shorter)
- Old: `/api/user/preferences` → New: `/api/privacy/preferences` (privacy-specific)
- Old: `/api/user/complete-onboarding` → New: `/api/onboarding/complete` (consistent)

### Health Checks (5 deprecated)
- Old: Multiple health endpoints → New: `/api/health` (comprehensive)
- Old: `/api/database-status` → New: `/api/database-health` (descriptive)

### Analytics (4 deprecated)
- Old: `/api/analytics/route.ts`, `/api/analytics/summary` → New: `/api/analytics/enhanced` (feature-complete)
- Old: `/api/analytics/unified/[id]` → New: `/api/analytics/enhanced-unified/[id]` (Redis caching)

### Trending (3 deprecated)
- Old: `/api/trending-polls`, `/api/polls/trending` → New: `/api/trending` (general)
- Old: `/api/trending/hashtags` → New: `/api/hashtags` (simpler)

### Dashboard (2 deprecated)
- Old: `/api/dashboard/data` → New: `/api/dashboard` (includes data)

### Admin Monitoring (2 deprecated)
- Old: `/api/admin/system-status` → New: `/api/admin/system-metrics` (includes status)

### Demographics (2 deprecated)
- Old: `/api/demographics` → New: `/api/analytics/demographics` (organized)

---

## Redirect Routes

All deprecated endpoints have redirect routes in their original locations that forward to the new consolidated endpoints. This ensures **backward compatibility**.

Example redirect:
```typescript
// app/api/civics/by-state/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Redirect to versioned endpoint
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/civics/', '/api/v1/civics/');
  return NextResponse.redirect(url, 308); // Permanent redirect
}
```

---

## Migration Timeline

1. **Phase 1** (Nov 5, 2025): Endpoints moved to `_deprecated-consolidation/`, redirects created
2. **Phase 2** (Dec 2025): Update all client code to use new endpoints
3. **Phase 3** (Jan 2026): Remove redirects, delete deprecated endpoints entirely

---

## For Developers

**DO NOT** add new code to files in this directory. These are deprecated and will be removed.

If you need functionality from a deprecated endpoint:
1. Check the README in its category folder
2. Find the new consolidated endpoint
3. Update your code to use the new endpoint
4. Test thoroughly

---

**Questions?** See `/scratch/library-audit-nov2025/API_DUPLICATION_AUDIT.md` for complete details.

