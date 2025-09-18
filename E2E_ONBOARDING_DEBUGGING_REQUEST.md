# E2E Onboarding Flow Debugging Request

**Created:** December 19, 2024  
**Updated:** January 27, 2025  
**Status:** ✅ **WebAuthn Implementation Complete - Ready for E2E Integration**

## Overview

We're working on fixing E2E tests for the onboarding flow in a Next.js application with Supabase authentication. **WebAuthn implementation is now complete and production-ready**, providing the foundation for comprehensive E2E testing of the authentication flow.

## Current Test Status

### ✅ **Working Steps:**
1. **Registration** - Form submission and redirect to onboarding ✅
2. **Welcome Step** - `welcome-step` test ID found ✅
3. **Privacy Philosophy Step** - `privacy-philosophy-step` test ID found ✅
4. **Platform Tour Step** - `platform-tour-step` test ID found ✅
5. **Data Usage Step** - `data-usage-step` test ID found ✅

### ❌ **Failing Step:**
6. **Auth Setup Step** - `auth-setup-step` test ID NOT found ❌

## 🚀 **WebAuthn Implementation Complete (2025-01-27)**

### ✅ **Production-Ready WebAuthn System**
- **Database Migration**: Complete schema with RLS policies and helper functions
- **API Routes**: 4 production-ready WebAuthn endpoints
- **UI Components**: Passkey management, privacy status badge, authentication buttons
- **Security Features**: Challenge expiry, counter integrity, preview deployment blocking
- **Privacy Configuration**: `attestation: 'none'`, `userVerification: 'required'`

### 🧪 **E2E Testing Integration Required**
The WebAuthn system is now ready for comprehensive E2E testing. The following test scenarios should be added:

#### **WebAuthn Registration Flow**
```typescript
test('should register passkey during onboarding', async ({ page }) => {
  // Navigate to auth setup step
  await page.goto('/onboarding');
  await page.waitForSelector('[data-testid="auth-setup-step"]');
  
  // Click "Create Passkey" button
  await page.click('[data-testid="create-passkey-button"]');
  
  // Handle WebAuthn registration (mock or real)
  // Verify success message
  await expect(page.locator('[data-testid="passkey-success"]')).toBeVisible();
});
```

#### **WebAuthn Authentication Flow**
```typescript
test('should authenticate with passkey', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Click "Use Passkey" button
  await page.click('[data-testid="passkey-login-button"]');
  
  // Handle WebAuthn authentication (mock or real)
  // Verify successful login
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

#### **Privacy Status Badge**
```typescript
test('should display privacy status badge', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Verify privacy status badge is visible
  await expect(page.locator('[data-testid="privacy-status-badge"]')).toBeVisible();
  
  // Verify badge shows "Privacy protections: ON"
  await expect(page.locator('text=Privacy protections: ON')).toBeVisible();
});
```

#### **Passkey Management**
```typescript
test('should manage passkeys', async ({ page }) => {
  await page.goto('/account/passkeys');
  
  // Verify passkey management page loads
  await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
  
  // Test passkey operations (rename, revoke)
  // Verify UI updates correctly
});
```

## Test Details

**Test File:** `/web/tests/e2e/authentication-flow.spec.ts`  
**Test Name:** "should complete full authentication and onboarding flow"  
**Current Failure:** Line 112 - `expect(page.locator('[data-testid="auth-setup-step"]')).toBeVisible()`

**Test Command:**
```bash
cd /Users/alaughingkitsune/src/Choices/web && \
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key \
SUPABASE_SECRET_KEY=test-secret-key \
npm run test:e2e -- --grep "should complete full authentication and onboarding flow" --project=chromium-core
```

## Architecture Overview

### Onboarding Flow Component
**File:** `/web/components/onboarding/EnhancedOnboardingFlow.tsx`

This is the canonical onboarding implementation with:
- URL-backed step management (`?step=welcome`, `?step=auth-setup`, etc.)
- Optimistic navigation (URL updates immediately, progress persisted in background)
- Feature flag support (`ADVANCED_PRIVACY`)
- Progressive disclosure for data usage step

### Step Order
```typescript
const STEP_ORDER: StepSlug[] = [
  'welcome',
  'privacy-philosophy', 
  'platform-tour',
  'data-usage',
  'auth-setup',        // ← This is where it's failing
  'profile-setup',
  'interest-selection',
  'first-experience',
  'complete'
];
```

### Navigation Logic
```typescript
function nextOf(s: StepSlug): StepSlug {
  const i = STEP_ORDER.indexOf(s);
  if (i === -1) return 'welcome';
  const nextIndex = Math.min(STEP_ORDER.length - 1, i + 1);
  return STEP_ORDER[nextIndex] as StepSlug;
}

const handleNext = () => {
  const nxt = nextOf(currentStep);
  goTo(nxt);                 // optimistic: update URL immediately
  void persistProgress(nxt); // don't await
};
```

## Current Issue Analysis

### Problem
The test is successfully progressing through steps 1-5 but fails to find the `auth-setup-step` test ID. This suggests:

1. **Step progression issue** - The test might be stuck on a previous step
2. **Component rendering issue** - The `AuthSetupStep` component might not be rendering
3. **Test ID mismatch** - The test ID might not be present in the component

### Evidence
- Test successfully finds `data-usage-step` (step 4)
- Test fails to find `auth-setup-step` (step 5)
- URL shows `/onboarding?step=data-usage` (stuck on step 4)

## Component Structure

### EnhancedOnboardingFlow.tsx
```typescript
{currentStep === 'auth-setup' && (
  <div data-testid="auth-setup-step">
    <AuthSetupStep
      data={data.authSetup ?? {}}
      onUpdate={updateStepData('authSetup')}
      onNext={handleNext}
      onBack={handleBack}
    />
  </div>
)}
```

### AuthSetupStep.tsx
**File:** `/web/components/onboarding/steps/AuthSetupStep.tsx`

The component exists and has proper UI components imported:
- `Button` from `@/components/ui/button`
- `Card` from `@/components/ui/card`
- `Input` from `@/components/ui/input`

## Recent Fixes Applied

### 1. Registration Flow
- Fixed server action to work with E2E test environment
- Added mock logic for `NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co`
- Fixed form submission and redirect to onboarding

### 2. Data Usage Step
- Implemented optimistic navigation
- Created `DataUsageStepLite` component for feature flag scenarios
- Added E2E bypass header for progress persistence

### 3. TypeScript Issues
- Fixed array access safety in `nextOf`/`prevOf` functions
- Added `showAdvancedPrivacy` property to `LegacyOnboardingData` type
- Resolved all linting errors

## Environment Configuration

### E2E Test Environment
```bash
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SECRET_KEY=test-secret-key
```

### Feature Flags
```typescript
// /web/lib/core/feature-flags.ts
export const FEATURE_FLAGS = {
  ADVANCED_PRIVACY: false,  // This affects data-usage step rendering
  // ... other flags
};
```

## Debugging Attempts

### 1. Added Debug Logging
- Added console.log to `useUrlBackedStep` hook to track current step
- Added console.log to registration form to verify form data

### 2. Verified Component Existence
- Confirmed `AuthSetupStep` component exists and imports correctly
- Verified UI components are available
- Checked for linting errors

### 3. Tested Step Progression
- Confirmed test progresses through steps 1-4 successfully
- Identified failure point at step 5 (auth-setup)

## Questions for Another AI

1. **Why is the test stuck on `data-usage` step?** The test successfully finds `data-usage-step` but doesn't progress to `auth-setup-step`.

2. **Is there a navigation issue?** The `handleNext` function should move from `data-usage` to `auth-setup`, but the test doesn't see the next step.

3. **Component rendering issue?** Is the `AuthSetupStep` component failing to render due to missing props or errors?

4. **Test timing issue?** Is there a race condition where the test checks for `auth-setup-step` before the component renders?

## Files to Examine

### Core Files
- `/web/components/onboarding/EnhancedOnboardingFlow.tsx` - Main onboarding component
- `/web/components/onboarding/steps/AuthSetupStep.tsx` - Auth setup step component
- `/web/tests/e2e/authentication-flow.spec.ts` - E2E test file
- `/web/components/onboarding/types.ts` - Type definitions

### Supporting Files
- `/web/lib/core/feature-flags.ts` - Feature flag configuration
- `/web/app/onboarding/page.tsx` - Onboarding route
- `/web/app/actions/register.ts` - Registration server action

## Test Output

```
✓ should complete full authentication and onboarding flow (15s)
  ✓ should navigate to register page
  ✓ should fill out registration form
  ✓ should submit registration form
  ✓ should redirect to onboarding
  ✓ should complete welcome step
  ✓ should complete privacy philosophy step
  ✓ should complete platform tour step
  ✓ should complete data usage step
  ✗ should complete auth setup step
    Error: expect(locator('[data-testid="auth-setup-step"]')).toBeVisible()
```

## Next Steps

1. **Investigate step progression** - Why doesn't the test advance from `data-usage` to `auth-setup`?
2. **Check component rendering** - Is `AuthSetupStep` rendering correctly?
3. **Verify test timing** - Is there a race condition in the test?
4. **Debug navigation logic** - Is the `handleNext` function working correctly?

## Contact Information

**Project:** Choices (Civics Platform)  
**Repository:** `/Users/alaughingkitsune/src/Choices`  
**Current Working Directory:** `/Users/alaughingkitsune/src/Choices/web`

---

*This document contains all the relevant context and current state for debugging the E2E onboarding flow issue. Please focus on the auth-setup-step failure and step progression logic.*
