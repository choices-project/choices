# E2E Testing Roadmap & Implementation Guide

**Created:** December 19, 2024  
**Updated:** December 19, 2024  
**Status:** Active Development

## 🎯 Overview

This roadmap outlines the comprehensive E2E testing strategy for the Choices platform, including test implementation, infrastructure setup, and best practices. All E2E tests use **Playwright** (NOT Jest) for browser-based testing.

## 📋 Current Status

### ✅ Completed
- **Feedback Widget E2E Tests** (4/4 passing) - Reference implementation
- **Complete Civics User Journey E2E Test Suite** ✅ - **13/15 tests passing** - Comprehensive test coverage including:
  - Architecture compliance (Supabase-only queries, no external APIs)
  - Privacy verification (address not persisted)
  - Error handling and fallback behavior
  - State-based representative lookup
  - Address extraction and state filtering
  - Representative data structure completeness
  - Empty address handling
  - Pagination and limit parameters
  - Data source attribution
  - Multiple address format handling
  - Representative filtering by level (federal/state/local)
  - API response metadata verification
- **E2E Test Infrastructure** - Fixed double hydration, motion components, selectors
- **Playwright Configuration** - Multiple environments (dev, staging, production)
- **Test Helpers & Utilities** - Comprehensive E2E testing toolkit

### 🚧 In Progress
- **Critical Feature E2E Tests** - 6 high-priority features need comprehensive testing
- **Medium Priority E2E Tests** - 2 features need basic E2E coverage
- **Test Suite Consolidation** - Remove redundant/outdated tests

### 📝 Pending
- **Documentation Updates** - Testing guides and component documentation
- **Feature Flag Validation** - Ensure all enabled features have corresponding tests
- **Performance Testing** - Load testing and performance benchmarks

## 🛠️ Testing Infrastructure

### Playwright Configuration Files
```
web/playwright.config.ts          # Main configuration
web/playwright.dev.config.ts      # Development environment
web/playwright.staging.config.ts  # Staging environment  
web/playwright.production.config.ts # Production environment
web/playwright.monitoring.config.ts # Monitoring/long-running tests
```

### Key Configuration Details
- **Base URLs**: Dev (localhost:3000), Staging (choices-platform-staging.vercel.app), Production (choices-platform.vercel.app)
- **Bypass Headers**: `x-e2e-bypass` for rate limiting and authentication bypass
- **Environment Variables**: `E2E=1`, `PLAYWRIGHT=1` for E2E mode detection
- **Timeouts**: 15s default, 30s for complex interactions

### Test Helpers & Utilities
```
web/tests/helpers/e2e-setup.ts    # Test data lifecycle, external API mocking
web/tests/utils/hydration.ts       # React hydration testing utilities
web/tests/fixtures/webauthn.ts    # WebAuthn testing fixtures
web/tests/e2e/global-setup.ts     # Feature flag configuration
```

## 🎯 Critical Features Needing E2E Tests

### 1. **CIVICS_REPRESENTATIVE_DATABASE** (High Priority)
**Status:** ✅ COMPLETED - Comprehensive E2E test suite created  
**Test File:** `web/tests/e2e/civics-complete-user-journey.spec.ts`

**Test Coverage:**
- ✅ Complete user journey: Registration → Onboarding → Address Lookup → Representative Auto-population
- ✅ Architecture compliance: Verifies `/api/civics/by-address` only queries Supabase (no external APIs)
- ✅ Privacy verification: Ensures addresses are not persisted, only jurisdiction used
- ✅ Error handling: Tests graceful failure and fallback behavior
- ✅ Component integration: Fixed API response handling in `UserOnboarding.tsx` and `UserProfile.tsx`

**Component Fixes:**
- Fixed `UserOnboarding.tsx` - Correctly extracts `representatives` from `result.data.representatives`
- Fixed `UserProfile.tsx` - Fixed both `handleAddressUpdateLocal` and `handleStateUpdate` functions

**Files Tested:**
- `/civics` page with representative cards
- Address lookup functionality (`/api/civics/by-address`)
- Representative auto-population in onboarding flow
- Data persistence in localStorage and userStore

**Reference Implementation:** `web/tests/e2e/feedback-widget.spec.ts`

### 2. **CIVICS_CAMPAIGN_FINANCE** (High Priority)
**Status:** Needs E2E testing for FEC data integration  
**Files to Test:**
- Campaign finance data display
- FEC API integration
- Financial transparency features

**Test Requirements:**
- Mock FEC API responses
- Test campaign finance data rendering
- Validate financial transparency features

### 3. **CIVICS_VOTING_RECORDS** (High Priority)
**Status:** Needs E2E testing for voting record display  
**Files to Test:**
- Voting record displays
- Representative voting history
- Vote tracking functionality

**Test Requirements:**
- Mock voting record API calls
- Test voting record rendering
- Validate vote tracking features

### 4. **CANDIDATE_CARDS** (High Priority)
**Status:** Needs E2E testing for candidate display  
**Files to Test:**
- Candidate card components
- Candidate information display
- Candidate interaction features

**Test Requirements:**
- Test candidate card rendering
- Validate candidate information display
- Test candidate interaction features

### 5. **ALTERNATIVE_CANDIDATES** (High Priority)
**Status:** Needs E2E testing for alternative candidate features  
**Files to Test:**
- Alternative candidate displays
- Candidate comparison features
- Alternative candidate selection

**Test Requirements:**
- Test alternative candidate rendering
- Validate candidate comparison features
- Test alternative candidate selection

### 6. **FEEDBACK_WIDGET** (High Priority)
**Status:** ✅ COMPLETED - Standalone test file created  
**Test File:** `web/tests/e2e/feedback-widget.spec.ts`  
**Coverage:**
- Widget rendering and interaction
- Multi-step form submission (Bug Report, Feature Request, General Feedback)
- Sentiment selection
- Offline/retry behavior
- User journey tracking
**Also tested in:** `user-journeys.spec.ts` (comprehensive user lifecycle flows)

## 🔧 Medium Priority Features

### 1. **FEATURE_DB_OPTIMIZATION_SUITE** (Medium Priority)
**Status:** ✅ COMPLETED - E2E tests exist  
**Test File:** `web/tests/e2e/db-optimization.spec.ts`  
**Coverage:**
- Admin performance endpoints (`/api/admin/performance`)
- Database health metrics
- Performance export formats (JSON)
- Query optimization monitoring

### 2. **ANALYTICS** (Medium Priority)
**Status:** ✅ COMPLETED - E2E tests exist  
**Test File:** `web/tests/e2e/analytics.spec.ts`  
**Coverage:**
- Admin analytics dashboard rendering
- Auto-refresh toggle functionality
- Analytics API endpoint responses
- Performance data display

## 📚 Best Practices & Implementation Guide

### 🚨 CRITICAL: Use Playwright, NOT Jest for E2E Tests

**❌ WRONG:** Using Jest for E2E tests  
**✅ CORRECT:** Using Playwright for E2E tests

```typescript
// ✅ CORRECT: Playwright E2E test
import { test, expect } from '@playwright/test'

test('feature works correctly', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('.feature-element')).toBeVisible()
})
```

### 🎯 Reference Implementation: Feedback Widget Tests

**File:** `web/tests/e2e/feedback-widget.spec.ts`  
**Why it's a good example:**
- Comprehensive test coverage (4 test scenarios)
- Proper external API mocking
- Realistic user interaction flows
- Proper error handling and edge cases
- Good use of Playwright utilities

### 🔧 E2E Test Implementation Pattern

```typescript
import { test, expect } from '@playwright/test'
import { setupExternalAPIMocks, waitForPageReady } from '../helpers/e2e-setup'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup external API mocks
    await setupExternalAPIMocks(page)
    
    // Navigate to test page
    await page.goto('/test-page')
    await waitForPageReady(page)
  })

  test('should work correctly', async ({ page }) => {
    // Test implementation
    await expect(page.locator('.test-element')).toBeVisible()
  })
})
```

### 🛠️ Available Testing Tools

#### Playwright Utilities
```typescript
// Page navigation and waiting
await page.goto('/dashboard')
await waitForPageReady(page)

// Element interaction
await page.locator('.button').click()
await page.fill('input[name="email"]', 'test@example.com')

// Assertions
await expect(page.locator('.success-message')).toBeVisible()
await expect(page.locator('.error-message')).toHaveText('Error message')
```

#### Test Helpers
```typescript
// External API mocking
await setupExternalAPIMocks(page)

// Test data lifecycle
await createTestUser()
await createTestPoll()
await cleanupE2ETestData()

// Hydration utilities
await waitForHydrationAndForm(page)
await waitForHydrationAndFormElements(page)
```

#### WebAuthn Testing
```typescript
// WebAuthn fixtures for passkey testing
import { test as webauthnTest } from '../fixtures/webauthn'

webauthnTest('WebAuthn flow', async ({ page, webauthn }) => {
  // WebAuthn-specific test implementation
})
```

### 🎨 Motion Component Testing

**Important:** Motion components are E2E-aware and use no-op implementations during testing.

```typescript
// Motion components automatically detect E2E mode
const IS_E2E = process.env.NODE_ENV === 'test' || 
               process.env.E2E === '1' || 
               process.env.PLAYWRIGHT === '1'
```

### 🔐 Authentication & Bypass

**E2E Bypass Mechanisms:**
- Header: `x-e2e-bypass`
- Query parameter: `?e2e=1`
- Cookie: `E2E=1`

**Rate Limiting Bypass:**
```typescript
// Automatically handled by Playwright configuration
extraHTTPHeaders: {
  'x-e2e-bypass': 'true'
}
```

## 📋 Implementation Checklist

### Phase 1: Critical Features (High Priority)
- [x] **CIVICS_REPRESENTATIVE_DATABASE** - ✅ Comprehensive E2E tests (`civics-representative-db.spec.ts`, `civics-complete-user-journey.spec.ts`)
- [x] **CIVICS_CAMPAIGN_FINANCE** - ✅ E2E tests created (`civics-campaign-finance.spec.ts`)
- [x] **CIVICS_VOTING_RECORDS** - ✅ E2E tests created (`civics-voting-records.spec.ts`)
- [x] **CANDIDATE_CARDS** - ✅ Covered in civics test suite (cards displayed on `/civics` page)
- [x] **ALTERNATIVE_CANDIDATES** - ✅ Dedicated E2E tests (`candidate-accountability-alternatives.spec.ts`)
- [x] **FEEDBACK_WIDGET** - ✅ Standalone E2E tests (`feedback-widget.spec.ts`)

### Phase 2: Medium Priority Features
- [x] **FEATURE_DB_OPTIMIZATION_SUITE** - ✅ E2E tests created (`db-optimization.spec.ts`)
- [x] **ANALYTICS** - ✅ E2E tests created (`analytics.spec.ts`)

### Phase 3: Test Suite Consolidation
- [ ] Review existing E2E tests for redundancy
- [ ] Remove outdated or duplicate tests
- [ ] Consolidate similar test patterns
- [ ] Update test documentation

### Phase 4: Documentation & Validation
- [ ] Update testing documentation
- [ ] Validate all feature flags have corresponding tests
- [ ] Create performance testing suite
- [ ] Update component documentation

## 🚀 Getting Started for New Agents

### 1. **Understand the Testing Stack**
- **E2E Tests:** Playwright (browser-based)
- **Unit Tests:** Jest (for individual components)
- **Integration Tests:** Playwright (for API endpoints)

### 2. **Study the Reference Implementation**
- Read `web/tests/e2e/feedback-widget.spec.ts` thoroughly
- Understand the test patterns and utilities used
- Note the external API mocking approach

### 3. **Set Up Development Environment**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run E2E tests
npm run test:e2e
```

### 4. **Follow the Implementation Pattern**
- Use the feedback widget tests as a template
- Implement comprehensive test coverage
- Include error handling and edge cases
- Use proper Playwright utilities and helpers

### 5. **Test Execution**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- --grep "Feature Name"

# Run with specific browser
npm run test:e2e -- --project=chromium
```

## 🔍 Key Files to Reference

### Configuration Files
- `web/playwright.config.ts` - Main Playwright configuration
- `web/playwright.dev.config.ts` - Development environment
- `web/middleware.ts` - E2E bypass logic

### Test Utilities
- `web/tests/helpers/e2e-setup.ts` - Test data lifecycle
- `web/tests/utils/hydration.ts` - React hydration utilities
- `web/tests/fixtures/webauthn.ts` - WebAuthn testing fixtures

### Reference Implementations
- `web/tests/e2e/feedback-widget.spec.ts` - **STANDALONE FEATURE TEST** - Comprehensive feedback widget testing
- `web/tests/e2e/civics-complete-user-journey.spec.ts` - **COMPREHENSIVE USER JOURNEY** - Complete flow with architecture compliance
- `web/tests/e2e/user-journeys.spec.ts` - **USER LIFECYCLE** - Complete user workflows including feedback widget
- `web/tests/e2e/candidate-accountability-alternatives.spec.ts` - **FEATURE SECTION TEST** - Alternative candidates within accountability card
- `web/tests/e2e/civics-campaign-finance.spec.ts` - **FEATURE INTEGRATION** - Campaign finance within accountability card

### Component Files
- `web/components/motion/Motion.tsx` - E2E-aware motion components
- `web/components/EnhancedFeedbackWidget.tsx` - Feature implementation
- `web/app/(app)/layout.tsx` - App layout with E2E considerations

## 🎯 Success Criteria

### Test Coverage Goals
- **Critical Features:** 100% E2E test coverage
- **Medium Priority Features:** Basic E2E test coverage
- **All Enabled Features:** Corresponding E2E tests

### Quality Standards
- Tests should be **functional and factual** (not just passing)
- Tests should validate **how the system SHOULD work**
- Tests should include **error handling and edge cases**
- Tests should use **realistic user interaction patterns**

### Performance Targets
- E2E tests should complete in < 30 seconds per test
- Tests should be reliable and not flaky
- Tests should provide clear failure messages

## 📞 Support & Resources

### Internal Documentation
- `web/FEATURES_NEEDING_E2E_TESTING.md` - Feature analysis
- `web/tests/e2e/` - All E2E test implementations
- `web/tests/helpers/` - Testing utilities and helpers

### External Resources
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

---

**Remember:** This is a living document. Update it as new features are implemented and testing patterns evolve. The goal is to maintain a comprehensive, reliable E2E testing suite that validates the entire Choices platform functionality.

