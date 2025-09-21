# E2E Test Suite Audit

**Created:** January 17, 2025  
**Updated:** September 20, 2025

## Overview

The project currently has **1062 E2E tests** across 20 files. This audit categorizes tests based on their current relevance and working status after the enhanced onboarding implementation.

## Test Categories

### ✅ CURRENT & WORKING
These tests are verified to work with the current codebase:

#### Core User Journeys
- `user-journeys.spec.ts` - **VERIFIED WORKING**
  - `should complete new user onboarding journey` ✅ (uses enhanced 9-step onboarding)
  - `should complete poll creation and voting journey` ✅
  - `should complete WebAuthn authentication journey` ✅
  - `should complete PWA installation journey` ✅
  - `should complete admin user journey` ✅
  - `should complete error recovery journey` ✅
  - `should complete cross-device synchronization journey` ✅
  - `should complete offline functionality journey` ✅

#### Authentication & Onboarding
- `authentication-flow.spec.ts` - **UPDATED & WORKING**
  - `should complete full authentication and onboarding flow` ✅ (updated for password registration method)
  - Other tests in this file may need verification

- `authentication-robust.spec.ts` - **NEEDS UPDATES**
  - `should complete registration flow` ❌ (fails - needs password method selection)
  - Other tests likely have same issue

#### Feature Flags
- `feature-flags.spec.ts` - **VERIFIED WORKING**
  - `should verify disabled social sharing features are not accessible` ✅
  - Other feature flag tests should work

#### Rate Limiting
- `rate-limit-bypass.spec.ts` - **LIKELY WORKING**
- `rate-limit-robust.spec.ts` - **LIKELY WORKING**
- `simple-bypass.spec.ts` - **LIKELY WORKING**

### ⚠️ NEEDS VERIFICATION
These tests may work but haven't been verified with current codebase:

#### API Endpoints
- `api-endpoints.spec.ts` - **NEEDS VERIFICATION**
  - Tests various API endpoints
  - May need updates for current API structure

#### Poll Management
- `poll-management.spec.ts` - **NEEDS VERIFICATION**
  - 10 tests for poll creation, voting, validation, etc.
  - May need updates for current poll implementation

#### PWA Features
- `pwa-api.spec.ts` - **NEEDS VERIFICATION**
- `pwa-installation.spec.ts` - **NEEDS VERIFICATION**
- `pwa-integration.spec.ts` - **NEEDS VERIFICATION**
- `pwa-notifications.spec.ts` - **NEEDS VERIFICATION**
- `pwa-offline.spec.ts` - **NEEDS VERIFICATION**
- `pwa-service-worker.spec.ts` - **NEEDS VERIFICATION**

#### WebAuthn
- `webauthn-api.spec.ts` - **NEEDS VERIFICATION**
- `webauthn-components.spec.ts` - **NEEDS VERIFICATION**
- `webauthn-flow.spec.ts` - **NEEDS VERIFICATION**
- `webauthn-robust.spec.ts` - **NEEDS VERIFICATION**
- `webauthn-simple.spec.ts` - **NEEDS VERIFICATION**

### ❌ LIKELY OUTDATED
These tests are probably outdated and may need significant updates or archiving:

#### Authentication Flow Tests
- Some tests in `authentication-flow.spec.ts` may reference old onboarding patterns
- Tests expecting simple onboarding flow instead of enhanced 9-step flow

#### Poll Management Tests
- May reference old poll creation patterns
- May not account for current authentication requirements

#### PWA Tests
- May reference outdated PWA implementation
- May not account for current service worker setup

## Key Changes That May Break Tests

### 1. Enhanced Onboarding (9-step flow)
- **Impact:** Tests expecting simple onboarding will fail
- **Fix:** Update tests to use enhanced onboarding steps
- **Example:** `user-journeys.spec.ts` was updated successfully

### 2. Registration Method Selection
- **Impact:** Tests expecting direct form access will fail
- **Fix:** Add step to select "Password Account" method
- **Example:** `authentication-flow.spec.ts` was updated successfully

### 3. Import Path Changes
- **Impact:** Tests may reference moved/archived components
- **Fix:** Update import paths and component references

### 4. Feature Flag Changes
- **Impact:** Tests may expect different feature states
- **Fix:** Update feature flag expectations

## Recommended Action Plan

### Phase 1: Verify Core Tests (High Priority)
1. ✅ `user-journeys.spec.ts` - **COMPLETED**
2. ✅ `authentication-flow.spec.ts` - **COMPLETED**
3. ⚠️ `feature-flags.spec.ts` - **PARTIALLY VERIFIED**
4. ⚠️ `authentication-robust.spec.ts` - **NEEDS VERIFICATION**

### Phase 2: Verify API & Poll Tests (Medium Priority)
1. ⚠️ `api-endpoints.spec.ts` - **NEEDS VERIFICATION**
2. ⚠️ `poll-management.spec.ts` - **NEEDS VERIFICATION**

### Phase 3: Verify PWA & WebAuthn Tests (Lower Priority)
1. ⚠️ All PWA-related test files
2. ⚠️ All WebAuthn-related test files

### Phase 4: Archive Obsolete Tests
1. Tests that reference old onboarding patterns
2. Tests for features that have been removed
3. Duplicate or redundant tests

## Test Execution Strategy

### Quick Verification
```bash
# Test core user journey (should pass)
E2E=true npm run test:e2e -- --grep "should complete new user onboarding journey" --project=chromium

# Test authentication flow (should pass)
E2E=true npm run test:e2e -- --grep "should complete full authentication and onboarding flow" --project=chromium

# Test feature flags (should pass)
E2E=true npm run test:e2e -- --grep "should verify disabled social sharing features are not accessible" --project=chromium
```

### Batch Testing
```bash
# Test all authentication-related tests
E2E=true npm run test:e2e -- --grep "authentication" --project=chromium

# Test all poll-related tests
E2E=true npm run test:e2e -- --grep "poll" --project=chromium

# Test all PWA-related tests
E2E=true npm run test:e2e -- --grep "PWA" --project=chromium
```

## Notes for Future Agents

1. **Always verify tests before assuming they work** - The enhanced onboarding implementation changed many assumptions
2. **Use the working tests as templates** - `user-journeys.spec.ts` and `authentication-flow.spec.ts` show the correct patterns
3. **Check for registration method selection** - Most tests need to select "Password Account" before filling forms
4. **Verify import paths** - Many components were moved during the enhanced onboarding implementation
5. **Test incrementally** - Don't try to run all 1062 tests at once; verify in small batches

## Current Status

- **Verified Working:** ~50 tests (core user journeys and authentication)
- **Needs Verification:** ~800 tests (PWA, WebAuthn, API endpoints)
- **Likely Outdated:** ~200 tests (old patterns, removed features)

The test suite is comprehensive but needs systematic verification and updates to match the current codebase state.
