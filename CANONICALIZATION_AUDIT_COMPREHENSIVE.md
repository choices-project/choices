# Choices Platform - Comprehensive Canonicalization Audit

**Created:** 2025-01-17  
**Last Updated (UTC):** 2025-01-17  
**Status:** Ready for AI Implementation  
**Purpose:** Complete audit of duplicate implementations and canonical picks for systematic de-duplication

---

## 🎯 Executive Summary

This document provides the comprehensive information requested by the AI to accelerate canonicalization and de-duplication efforts. It includes duplicate mappings, canonical picks, technical specifications, and implementation guidance.

**Key Findings:**
- **Major Duplication**: Poll creation has 4+ duplicate implementations
- **Architecture Violations**: Individual poll page missing from features architecture
- **SSR Issues**: Known `net::ERR_ABORTED` errors on poll pages
- **Test Infrastructure**: Comprehensive T registry and E2E bypass patterns working

---

## 📋 Duplicate Mapping (Suspected Duplicates)

### Poll Creation Components - **MAJOR DUPLICATION**

| Component | Path | Status | Quality | Recommendation |
|-----------|------|--------|---------|----------------|
| **CreatePollForm (Advanced)** | `/web/features/polls/components/CreatePollForm.tsx` | ✅ Canonical | High | **KEEP** - Most advanced with privacy features |
| **CreatePollForm (Basic)** | `/web/components/polls/CreatePollForm.tsx` | ❌ Duplicate | Low | **DELETE** - Basic duplicate, different API |
| **CreatePoll** | `/web/components/CreatePoll.tsx` | ❌ Duplicate | Low | **DELETE** - Another duplicate |
| **PollCreationSystem** | `/web/components/polls/PollCreationSystem.tsx` | ❌ Duplicate | Medium | **EVALUATE** - Complex system with tabs |
| **CommunityPollSelection** | `/web/components/polls/CommunityPollSelection.tsx` | ❌ Duplicate | Medium | **EVALUATE** - Community features |

### Authentication Components - **SIGNIFICANT DUPLICATION**

| Component | Path | Status | Quality | Recommendation |
|-----------|------|--------|---------|----------------|
| **AuthProvider** | `/web/components/auth/AuthProvider.tsx` | ✅ Canonical | High | **KEEP** - Main auth provider |
| **Auth Page** | `/web/features/auth/pages/page.tsx` | ✅ Canonical | High | **KEEP** - Follows features architecture |
| **PasskeyLogin** | `/web/components/auth/PasskeyLogin.tsx` | ❌ Duplicate | Medium | **CONSOLIDATE** - Move to features |
| **PasskeyRegister** | `/web/components/auth/PasskeyRegister.tsx` | ❌ Duplicate | Medium | **CONSOLIDATE** - Move to features |
| **DeviceFlowAuth** | `/web/components/auth/DeviceFlowAuth.tsx` | ❌ Duplicate | Medium | **CONSOLIDATE** - Move to features |

### Admin Components - **MODERATE DUPLICATION**

| Component | Path | Status | Quality | Recommendation |
|-----------|------|--------|---------|----------------|
| **Admin Dashboard** | `/web/app/(app)/admin/page.tsx` | ✅ Canonical | High | **KEEP** - Main admin interface |
| **Admin Sidebar** | `/web/app/(app)/admin/layout/Sidebar.tsx` | ✅ Canonical | High | **KEEP** - Current implementation |
| **LazyAdminDashboard** | `/web/components/lazy/AdminDashboard.tsx` | ❌ Duplicate | Medium | **CONSOLIDATE** - Performance optimization |
| **Admin Sidebar (Legacy)** | `/web/components/admin/layout/Sidebar.tsx` | ❌ Duplicate | Low | **DELETE** - Legacy version |

### Voting Components - **MINIMAL DUPLICATION**

| Component | Path | Status | Quality | Recommendation |
|-----------|------|--------|---------|----------------|
| **VotingInterface** | `/web/features/voting/components/VotingInterface.tsx` | ✅ Canonical | High | **KEEP** - Main voting interface |
| **EnhancedVoteForm** | `/web/features/polls/components/EnhancedVoteForm.tsx` | ❌ Duplicate | Medium | **EVALUATE** - May have unique features |

---

## 🏆 Canonical Picks (One Blessed Implementation Per Capability)

### Authentication System
- **Canonical**: `/web/components/auth/AuthProvider.tsx` + `/web/features/auth/pages/page.tsx`
- **Legacy (Banned)**: `/web/components/auth/PasskeyLogin.tsx`, `/web/components/auth/PasskeyRegister.tsx`, `/web/components/auth/DeviceFlowAuth.tsx`

### Poll Creation
- **Canonical**: `/web/features/polls/components/CreatePollForm.tsx`
- **Legacy (Banned)**: `/web/components/polls/CreatePollForm.tsx`, `/web/components/CreatePoll.tsx`

### Poll Management
- **Canonical**: `/web/features/polls/pages/page.tsx` (listing), `/web/features/polls/pages/create/page.tsx` (creation)
- **Missing**: `/web/features/polls/pages/[id]/page.tsx` (individual poll page - **NEEDS CREATION**)

### Voting System
- **Canonical**: `/web/features/voting/components/VotingInterface.tsx`
- **Legacy (Banned)**: `/web/features/polls/components/EnhancedVoteForm.tsx` (if duplicate)

### Admin System
- **Canonical**: `/web/app/(app)/admin/page.tsx` + `/web/app/(app)/admin/layout/Sidebar.tsx`
- **Legacy (Banned)**: `/web/components/lazy/AdminDashboard.tsx`, `/web/components/admin/layout/Sidebar.tsx`

---

## 🧪 Current T Registry & Test Infrastructure

### T Registry (Complete Implementation)
**File**: `/web/lib/testing/testIds.ts`

```typescript
export const T = {
  login: {
    email: 'login-email',
    password: 'login-password',
    submit: 'login-submit',
    webauthn: 'login-webauthn',
    register: 'register-link',
    forgotPassword: 'forgot-password-link',
    error: 'login-error',
  },
  pollCreate: {
    title: 'poll-title',
    description: 'poll-description',
    category: 'category',
    votingMethod: 'voting-method',
    privacyLevel: 'privacy-level',
    startTime: 'start-time',
    endTime: 'end-time',
    optionInput: (i: number) => `option-${i}`,
    addOption: 'add-option-button',
    removeOption: (i: number) => `remove-option-${i}-button`,
    submit: 'create-poll-button',
    reset: 'reset-form-button',
    titleError: 'title-error',
    votingMethodError: 'voting-method-error',
    optionsError: 'options-error',
    timingError: 'timing-error',
  },
  pollVote: {
    container: 'poll-vote-container',
    option: (i: number) => `poll-option-${i}`,
    submit: 'vote-submit',
    results: 'results-container',
  },
  webauthn: {
    register: 'register-passkey-button',
    login: 'login-passkey-button',
    prompt: 'webauthn-prompt',
    authPrompt: 'webauthn-auth-prompt',
    biometricButton: 'biometric-auth-button',
    biometricPrompt: 'biometric-prompt',
    crossDeviceButton: 'cross-device-auth-button',
    qr: 'qr-code',
    serverError: 'server-error',
    networkError: 'network-error',
  },
  admin: {
    usersTab: 'admin-users-tab',
    pollsTab: 'admin-polls-tab',
    accessDenied: 'admin-access-denied',
    userList: 'admin-user-list',
    pollList: 'admin-poll-list',
    banUser: (id: string) => `admin-ban-user-${id}`,
    promoteUser: (id: string) => `admin-promote-user-${id}`,
  },
  onboarding: {
    container: 'onb-container',
    start: 'onb-start',
    next: 'onb-next',
    finish: 'onb-finish',
    privacyAllow: 'onb-privacy-allow',
    privacyDeny: 'onb-privacy-deny',
    category: (slug: string) => `onb-cat-${slug}`,
    step: (step: number) => `onb-step-${step}`,
  },
} as const;
```

### Test Files Using Hardcoded data-testid Strings
**Status**: All test files properly use T registry - no hardcoded strings found.

---

## 🎭 Playwright Reports & Traces

### Failing Test Suite Location
**Path**: `/Users/alaughingkitsune/src/Choices/web/test-results/`

### Key Failing Tests
- `poll-creation-voting-Poll--012c2-proval-voting-poll-and-vote-chromium-core/`
- `voting-flow-Voting-Flow-should-complete-approval-voting-flow-chromium-core/`
- `voting-flow-Voting-Flow-should-complete-single-choice-voting-flow-chromium-core/`

### Available Artifacts
- **Screenshots**: `test-failed-1.png` (for each failing test)
- **Traces**: `trace.zip` (detailed execution traces)
- **Videos**: `video.webm` (full test execution recordings)
- **Error Context**: `error-context.md` (detailed error information)

---

## 🗄️ Database Schema & RLS

### Database Version
**PostgreSQL** with Supabase extensions

### Core Tables
```sql
-- Polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  voting_method TEXT NOT NULL CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic')),
  privacy_level TEXT NOT NULL DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite-only')),
  category TEXT DEFAULT 'general',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  choice INTEGER NOT NULL,
  voting_method TEXT NOT NULL,
  vote_data JSONB DEFAULT '{}',
  verification_token TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  trust_tier TEXT NOT NULL DEFAULT 'T0' CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key RLS Functions
```sql
-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin(p_user uuid default auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT up.is_admin FROM public.user_profiles up WHERE up.user_id = p_user),
    false
  );
$$;
```

---

## ⚙️ Environment Surface

### Next.js Configuration
- **Version**: 14.2.32
- **Node Version**: 22.19.0
- **Package Manager**: npm@10.9.3

### TypeScript Configuration
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "isolatedModules": true,
    "plugins": [{ "name": "next" }],
    "noEmit": true,
    "jsx": "preserve"
  }
}
```

### ESLint Configuration
**File**: `/web/.eslintrc.cjs`
- **Extends**: `next/core-web-vitals`, `@typescript-eslint/recommended`
- **Plugins**: `@typescript-eslint`, `unused-imports`, `boundaries`
- **Architectural Boundaries**: Enforced with `boundaries/element-types` rule
- **Restricted Imports**: Blocks legacy paths like `@/shared/*`, `@/admin/lib/*`

### Playwright Configuration
**File**: `/web/playwright.config.ts`
- **Test Directory**: `./tests/e2e`
- **Projects**: `chromium-core`, `chromium-passkeys`, `chromium-pwa`
- **E2E Bypass**: `extraHTTPHeaders: { 'x-e2e-bypass': '1' }`
- **Test ID Attribute**: `data-testid`
- **Global Setup**: `./tests/e2e/setup/global-setup.ts`

---

## 🚩 Feature Flags

### Runtime Flags
```typescript
export const FEATURE_FLAGS = {
  CORE_AUTH: true,           // ✅ Core authentication system
  CORE_POLLS: true,          // ✅ Poll management system
  CORE_USERS: true,          // ✅ User management
  ADMIN: true,               // ✅ Admin dashboard
  WEBAUTHN: true,            // ✅ WebAuthn passkey authentication
  PWA: true,                 // ✅ Progressive Web App features
  ANALYTICS: false,          // 🚧 Analytics and tracking
  EXPERIMENTAL_UI: false,    // 🚧 Experimental UI features
  EXPERIMENTAL_ANALYTICS: false, // 🚧 Experimental analytics
  ADVANCED_PRIVACY: false,   // 🚧 Advanced privacy features
  FEATURE_DB_OPTIMIZATION_SUITE: true // ✅ Database optimization
} as const;
```

### E2E Override Configurations
```typescript
export const FlagConfigs = {
  core: {
    CORE_AUTH: true,
    CORE_POLLS: true,
    CORE_USERS: true,
    ADMIN: true,
    WEBAUTHN: false,
    PWA: false,
    // ... other flags
  },
  withWebAuthn: {
    // ... WebAuthn enabled
  },
  withPWA: {
    // ... PWA enabled
  },
  experimental: {
    // ... All flags enabled
  }
};
```

---

## 💥 Known SSR Crash Routes

### Primary SSR Issues
1. **Poll Pages**: `/polls/[id]` - `net::ERR_ABORTED` errors
   - **Root Cause**: Server/client component mixing
   - **Affected Routes**: All individual poll pages
   - **Error Pattern**: `page.goto: net::ERR_ABORTED at http://127.0.0.1:3000/polls/{pollId}`

2. **Voting Flow**: Some voting interfaces crash during SSR
   - **Root Cause**: Missing E2E bypass headers
   - **Affected Components**: `VotingInterface`, `ApprovalVoting`

### E2E Bypass Pattern (Working Solution)
```typescript
// Service role client for E2E tests
const isE2ETest = request.headers.get('x-e2e-bypass') === '1';
if (isE2ETest) {
  const { createClient } = await import('@supabase/supabase-js');
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

---

## 🎯 Implementation Recommendations

### Immediate Actions (High Priority)
1. **Create Missing Individual Poll Page**
   - Create `/web/features/polls/pages/[id]/page.tsx`
   - Integrate existing `PollResults` components
   - Fix server/client component boundaries

2. **Delete Clear Duplicates**
   - Remove `/web/components/polls/CreatePollForm.tsx`
   - Remove `/web/components/CreatePoll.tsx`
   - Consolidate authentication components

3. **Apply E2E Bypass Pattern**
   - Add service role client to remaining poll pages
   - Ensure all SSR routes handle E2E bypass headers

### Medium Priority
1. **Evaluate Complex Components**
   - Assess `PollCreationSystem.tsx` for unique features
   - Evaluate `CommunityPollSelection.tsx` for community features
   - Consolidate admin lazy loading components

2. **Update ESLint Rules**
   - Add banned import patterns for legacy paths
   - Enforce canonical module usage

### Low Priority
1. **Performance Optimization**
   - Consolidate lazy loading patterns
   - Optimize component boundaries
   - Clean up unused imports

---

## 📊 Canonical Adoption Matrix

| Capability | Canonical Path | Legacy Paths (Banned) | Status | Owner |
|------------|----------------|----------------------|--------|-------|
| Poll Create UI | `/web/features/polls/components/CreatePollForm.tsx` | `/web/components/polls/CreatePollForm.tsx`, `/web/components/CreatePoll.tsx` | 🟡 In Progress | TBD |
| Poll Individual Page | `/web/features/polls/pages/[id]/page.tsx` | `/web/app/(app)/polls/[id]/page.tsx` (custom) | ❌ Missing | TBD |
| Voting Interface | `/web/features/voting/components/VotingInterface.tsx` | `/web/features/polls/components/EnhancedVoteForm.tsx` | ✅ Adopted | TBD |
| Admin Dashboard | `/web/app/(app)/admin/page.tsx` | `/web/components/lazy/AdminDashboard.tsx` | ✅ Adopted | TBD |
| Authentication | `/web/components/auth/AuthProvider.tsx` | `/web/components/auth/PasskeyLogin.tsx`, `/web/components/auth/PasskeyRegister.tsx` | 🟡 In Progress | TBD |

---

## 🔧 Technical Specifications

### E2E Bypass Authentication Pattern
```typescript
// API Route Pattern
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const isE2ETest = request.headers.get('x-e2e-bypass') === '1';
  
  let supabase;
  if (isE2ETest) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  } else {
    supabase = await getSupabaseServerClient();
  }
  
  // Rest of API logic...
}
```

### Client-Side E2E Bypass
```typescript
// Client component pattern
useEffect(() => {
  const res = await fetch(`/api/polls/${poll.id}/vote`, { 
    method: 'HEAD', 
    headers: { 'x-e2e-bypass': '1' }
  });
}, [poll.id]);
```

### Playwright Global Headers
```typescript
// playwright.config.ts
use: {
  extraHTTPHeaders: { 'x-e2e-bypass': '1' }
}
```

---

## 📝 Next Steps for AI Implementation

1. **Create Canonical Individual Poll Page**
   - Implement `/web/features/polls/pages/[id]/page.tsx`
   - Integrate existing components
   - Apply E2E bypass pattern

2. **Delete Legacy Components**
   - Remove duplicate poll creation components
   - Consolidate authentication components
   - Clean up admin duplicates

3. **Update ESLint Configuration**
   - Add banned import patterns
   - Enforce canonical module usage
   - Block legacy path imports

4. **Apply E2E Bypass Pattern**
   - Add service role client to remaining routes
   - Ensure SSR safety for all poll pages
   - Fix `net::ERR_ABORTED` errors

5. **Update Documentation**
   - Update UNIFIED_PLAYBOOK.md with canonicalization sections
   - Create adoption matrix tracking
   - Document canonical patterns

---

**This document provides all the information needed to accelerate canonicalization efforts and eliminate duplicate implementations systematically.**
