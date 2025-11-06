# Deprecated API Endpoints - Consolidation

**Date**: November 6, 2025  
**Status**: Consolidation in progress  
**Purpose**: Backward compatibility during API consolidation

---

## ⚠️ Warning

**All endpoints in this directory are DEPRECATED and will be removed in a future release.**

These endpoints now redirect to their canonical versions with proper HTTP redirects (307 Temporary Redirect for POST/PUT/DELETE, 301 Permanent Redirect for GET).

---

## Migration Guide

### For Developers

If you're using any endpoint in this directory, update your code to use the canonical version listed below.

### Deprecation Timeline

- **Phase 1** (Current): Endpoints moved here, redirects active
- **Phase 2** (2 weeks): Deprecation warnings in response headers
- **Phase 3** (1 month): Monitor usage via analytics
- **Phase 4** (2 months): Remove if usage < 1% of traffic

---

## Deprecated Endpoints

### Civics (8 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/civics/by-state` | `/api/v1/civics/by-state` | Redirect |
| `/api/civics/representative/[id]` | `/api/v1/civics/representative/[id]` | Redirect |
| `/api/civics/actions` | `/api/v1/civics/actions` | Redirect |
| `/api/civic-actions` | `/api/v1/civics/actions` | Redirect |
| `/api/district/[id]` | `/api/v1/civics/district/[id]` | Redirect |
| `/api/representatives/search` | `/api/v1/civics/representatives/search` | Redirect |

### Profile (6 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/user/profile` | `/api/profile` | Redirect |
| `/api/user/preferences` | `/api/profile/preferences` | Redirect |
| `/api/profile/data` | `/api/profile` | Redirect |
| `/api/user/settings` | `/api/profile/settings` | Redirect |

### Health/Status (4 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/health/civics` | `/api/health` | Redirect |
| `/api/status` | `/api/health` | Redirect |
| `/api/system/health` | `/api/health` | Redirect |

### Analytics (4 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/analytics/enhanced` | `/api/analytics` | Redirect |
| `/api/analytics/unified/[id]` | `/api/analytics/poll/[id]` | Redirect |
| `/api/analytics/summary` | `/api/analytics` | Redirect |

### Trending (3 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/trending-polls` | `/api/trending?type=polls` | Redirect |
| `/api/polls/trending` | `/api/trending?type=polls` | Redirect |

### Dashboard (3 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/dashboard/feed` | `/api/feed` | Redirect |
| `/api/dashboard/summary` | `/api/dashboard` | Redirect |

### Admin (2 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/admin/stats` | `/api/admin/dashboard` | Redirect |

### Demographics (2 endpoints)
| Deprecated | Canonical | Status |
|------------|-----------|--------|
| `/api/user/demographics` | `/api/analytics/demographics` | Redirect |

---

## Response Headers

All deprecated endpoints include these headers:

```
Deprecation: true
Sunset: 2026-01-06T00:00:00Z
Link: <https://choices.app/api/v1/canonical>; rel="canonical"
Warning: 299 - "This API endpoint is deprecated. Use /api/v1/canonical instead."
```

---

## Monitoring

Usage of deprecated endpoints is tracked in:
- Application logs (`logger.warn`)
- Analytics dashboard (`/admin/api-usage`)
- Supabase analytics

---

## Questions?

See full consolidation plan: `scratch/library-audit-nov2025/API_CONSOLIDATION_PLAN.md`
