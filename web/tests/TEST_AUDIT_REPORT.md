# Test Directory Audit Report

**Date:** November 30, 2025  
**Status:** Complete

## Summary

This audit identifies current/relevant tests, duplicates, and outdated files that should be archived or updated.

## Findings

### 1. Duplicate Test Files ✅ IDENTIFIED

**Duplicate AuthSetupStep Tests:**
- `web/tests/unit/onboarding/AuthSetupStep.test.tsx` - Older version, less complete
- `web/tests/unit/features/onboarding/AuthSetupStep.test.tsx` - Newer version, more complete

**Action:** Archive the older version in `unit/onboarding/` and keep the one in `unit/features/onboarding/`.

### 2. Production Test Files (choices-app-*.spec.ts) ⚠️

**21 files testing production site (choices-app.com):**
- These are production monitoring tests, not development tests
- They test against live production, not local dev server
- Not configured to run in CI (main Playwright config uses local baseURL)
- Should be archived or moved to separate production monitoring suite

**Files:**
- `choices-app-smoke.spec.ts`
- `choices-app-health-check.spec.ts`
- `choices-app-comprehensive.spec.ts`
- `choices-app-diagnostics.spec.ts`
- `choices-app-deep-diagnosis.spec.ts`
- `choices-app-investigation.spec.ts`
- `choices-app-react-init.spec.ts`
- `choices-app-script-execution.spec.ts`
- `choices-app-html-structure.spec.ts`
- `choices-app-edge-cases.spec.ts`
- `choices-app-api-endpoints.spec.ts`
- `choices-app-api-robustness.spec.ts`
- `choices-app-integration.spec.ts`
- `choices-app-performance.spec.ts`
- `choices-app-accessibility.spec.ts`
- `choices-app-security.spec.ts`
- `choices-app-auth.spec.ts`
- `choices-app-session.spec.ts`
- `choices-app-dashboard.spec.ts`
- `choices-app-user-journey.spec.ts`
- `choices-app-critical-flows.spec.ts`

**Action:** Archive to `tests/archive/production-monitoring/` with README explaining these are production monitoring tests.

### 3. Outdated Documentation Files ⚠️

**E2E Documentation Files (may be outdated):**
- `e2e/ACHIEVEMENTS.md`
- `e2e/CONTINUOUS_IMPROVEMENT.md`
- `e2e/FINAL_REPORT.md`
- `e2e/FINDINGS.md`
- `e2e/FIXES_APPLIED.md`
- `e2e/IMPROVEMENTS_PLAN.md`
- `e2e/IMPROVEMENTS.md`
- `e2e/RECOMMENDATIONS.md`
- `e2e/ROOT_CAUSE_ANALYSIS.md`
- `e2e/SUMMARY.md`
- `e2e/TEST_COVERAGE_REPORT.md`
- `e2e/TESTING_FINDINGS.md`

**Action:** Review and archive outdated reports, keep only current status docs.

### 4. Current/Relevant Tests ✅

**Keep These Active:**
- All `tests/unit/` tests (except duplicate AuthSetupStep)
- All `tests/contracts/` tests
- All `tests/api/` tests
- All `tests/e2e/specs/` tests EXCEPT `choices-app-*.spec.ts` files
- `tests/e2e/README.md` - Current documentation
- `tests/e2e/QUICK_START.md` - Current documentation
- `tests/README.md` - Current documentation
- `tests/TEST_STATUS.md` - Current status

## Actions Taken

1. ✅ Archive duplicate `AuthSetupStep.test.tsx` from `unit/onboarding/`
2. ✅ Archive all `choices-app-*.spec.ts` production monitoring tests
3. ✅ Archive outdated E2E documentation reports
4. ✅ Update test README and status files

## Archive Structure

```
tests/archive/
├── e2e-legacy/          (existing)
├── extra-docs/          (existing)
├── production-monitoring/  (new - choices-app-*.spec.ts files)
└── outdated-docs/        (new - outdated E2E reports)
```

## Next Steps

1. Review archived production monitoring tests - consider separate monitoring suite
2. Consolidate E2E documentation - keep only current status
3. Update CI/CD to exclude archived tests
4. Document test organization in main README

