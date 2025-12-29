# Archived Test Files

**Date Archived:** January 27, 2025  
**Reason:** Redundant, outdated, or diagnostic-only tests removed during test suite audit

## Archived Files

### Deep Diagnostic Tests (5 files)
These were created for specific debugging sessions and are no longer needed:
- `production-dashboard-deep-diagnostic.spec.ts`
- `production-profile-deep-diagnostic.spec.ts`
- `production-polls-deep-diagnostic.spec.ts`
- `production-admin-dashboard-deep-diagnostic.spec.ts`
- `production-polls-page-diagnostic.spec.ts`

### Outdated/Redundant Tests (7 files)
- `candidate-verification.spec.ts` - All tests skipped/commented out
- `production-observability.spec.ts` - One-time debugging test
- `production-cookie-inspection.spec.ts` - One-time debugging test
- `analytics-axe-baseline.spec.ts` - Redundant with analytics-dashboard-axe.spec.ts
- `analytics-dashboard-screen-reader.spec.ts` - Covered by comprehensive-a11y.spec.ts
- `smoke-critical.spec.ts` - Overlaps with production-smoke.spec.ts
- `profile-accessibility.spec.ts` - Covered by comprehensive-a11y.spec.ts

## Recovery

If any of these tests are needed, they can be restored from this archive directory.

## Test Suite Status

- **Before:** 76 test files
- **After:** 68 test files
- **Archived:** 12 files

