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

### Outdated/Redundant Tests (10 files)
- `candidate-verification.spec.ts` - All tests skipped/commented out
- `production-observability.spec.ts` - One-time debugging test
- `production-cookie-inspection.spec.ts` - One-time debugging test
- `analytics-axe-baseline.spec.ts` - Redundant with analytics-dashboard-axe.spec.ts
- `analytics-dashboard-screen-reader.spec.ts` - Covered by comprehensive-a11y.spec.ts
- `smoke-critical.spec.ts` - Overlaps with production-smoke.spec.ts
- `profile-accessibility.spec.ts` - Covered by comprehensive-a11y.spec.ts
- `production-all-pages.spec.ts` - Overlaps with production-smoke and production-critical-journeys
- `production-expanded.spec.ts` - Overlaps with production-smoke and production-critical-journeys
- `production-edge-cases.spec.ts` - Edge cases covered by comprehensive tests

## Recovery

If any of these tests are needed, they can be restored from this archive directory.

## Test Suite Status

- **Before:** 76 test files
- **After:** 64 test files
- **Archived:** 15 files (12 initial + 3 production consolidation)

