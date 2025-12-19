# Codebase Audit Report - Redundancies and Dead Code

## Executive Summary
This audit identifies redundant components, dead code, and unimplemented features that should be cleaned up or properly implemented.

## 🔴 Critical Redundancies (Should Be Removed)

### 1. Duplicate GlobalNavigation Components
- **`web/components/GlobalNavigation.tsx`** (221 lines) - ❌ **UNUSED**
  - Not imported anywhere
  - Older implementation using direct store access
  - No i18n support, no LanguageSelector/ThemeSelector
  
- **`web/components/shared/GlobalNavigation.tsx`** (365 lines) - ✅ **ACTIVE**
  - Used in: `app/(app)/layout.tsx`, E2E test pages
  - Modern implementation with hooks, i18n, accessibility features
  - **Action: DELETE `web/components/GlobalNavigation.tsx`**

### 2. Duplicate FeatureWrapper Components
- **`web/components/FeatureWrapper.tsx`** (387 lines) - ❌ **UNUSED**
  - Not imported anywhere
  - Uses `../hooks/useFeatureFlags` (relative path)
  
- **`web/components/shared/FeatureWrapper.tsx`** (414 lines) - ✅ **ACTIVE**
  - Used in: PersonalDashboard, BalancedOnboardingFlow, tests
  - Uses `@/features/pwa/hooks/useFeatureFlags` (absolute path)
  - **Action: DELETE `web/components/FeatureWrapper.tsx`**

### 3. Duplicate SiteMessages Components
- **`web/components/SiteMessages.tsx`** (299 lines) - ✅ **ACTIVE**
  - Used in: `app/(app)/layout.tsx`, E2E test pages
  - More complete implementation with logger, ScreenReaderSupport
  
- **`web/components/shared/SiteMessages.tsx`** (207 lines) - ❌ **UNUSED**
  - Not imported anywhere
  - Simpler implementation, uses useI18n
  - **Action: DELETE `web/components/shared/SiteMessages.tsx`**

### 4. Duplicate FontProvider Components
- **`web/components/FontProvider.tsx`** (22 lines) - ❌ **UNUSED**
  - Not imported anywhere
  - Has syntax issue: `'use client'` after imports
  
- **`web/components/shared/FontProvider.tsx`** (22 lines) - ✅ **ACTIVE**
  - Used in: `app/(app)/layout.tsx`, E2E test pages
  - Properly structured
  - **Action: DELETE `web/components/FontProvider.tsx`**

### 5. Duplicate CommunityPollSelection Components
- **`web/components/polls/CommunityPollSelection.tsx`** - ⚠️ **LEGACY PATH**
  - Located in banned legacy path per `dangerfile.js`
  - Same component exists in `web/features/polls/components/CommunityPollSelection.tsx`
  - **Action: DELETE `web/components/polls/CommunityPollSelection.tsx`** (use features version)

## 🟡 Potential Issues

### 6. Duplicate DeviceList Components
- **`web/components/DeviceList.tsx`** - Check if used
- **`web/components/shared/DeviceList.tsx`** - Check if used
- **Action: Verify usage and consolidate**

### 7. Duplicate BurgerMenu Components
- **`web/components/navigation/BurgerMenu.tsx`** - Check if used
- **`web/components/shared/BurgerMenu.tsx`** - Check if used
- **Action: Verify usage and consolidate**

## 🟢 Unimplemented/Stub Code

### 8. Export Statement (Verified - Actually Complete)
- **`web/features/feeds/index.ts:53`** - Export is complete (verified)

### 9. Console Statements in Production Code
Found console.log/warn/error in:
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts:1310`
- `web/tests/e2e/specs/auth/auth-production.spec.ts:83`
- `web/tests/e2e/specs/dashboard/dashboard-journey.spec.ts:246`
- `web/tests/e2e/specs/production/production-observability.spec.ts` (multiple)
- `web/app/(app)/e2e/admin-store/page.tsx:212`

**Action:** Replace with proper logger or remove (tests can use console)

## 📋 Legacy Paths (Per dangerfile.js)
These paths are banned but one file exists:
- `web/components/polls/CommunityPollSelection.tsx` - Should be removed (duplicate exists in features)

## ✅ Recommendations

### Immediate Actions:
1. **DELETE** `web/components/GlobalNavigation.tsx` (unused duplicate)
2. **DELETE** `web/components/FeatureWrapper.tsx` (unused duplicate)
3. **DELETE** `web/components/shared/SiteMessages.tsx` (unused duplicate)
4. **DELETE** `web/components/FontProvider.tsx` (unused duplicate)
5. **DELETE** `web/components/polls/CommunityPollSelection.tsx` (legacy path, duplicate exists)
6. **FIX** `web/features/feeds/index.ts:53` - Complete the export statement

### Follow-up Actions:
7. Verify and consolidate DeviceList components
8. Verify and consolidate BurgerMenu components
9. Review console statements in production code (tests are OK)

## 📊 Summary
- **5 confirmed redundant files** to delete
- **1 broken export** to fix
- **2 potential redundancies** to verify
- **Legacy paths** properly enforced by dangerfile.js

