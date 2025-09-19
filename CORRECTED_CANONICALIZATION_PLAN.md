# Corrected Canonicalization Plan - MVP Deploy Ready

**Created:** 2025-01-27  
**Branch:** `canonicalization-mvp-deploy`  
**Purpose:** Implement corrected canonicalization for MVP deploy

---

## 🎯 **CORRECTED DECISIONS**

Based on our analysis, we need to **KEEP** `AnalyticsDashboard.tsx` for admin analytics while disabling the duplicate `EnhancedDashboard.tsx`.

### **KEEP (Canonical - Better Versions):**

#### **Authentication System:**
- ✅ `web/lib/core/auth/middleware.ts` - Advanced auth with rate limiting, CSRF protection
- ✅ `web/contexts/AuthContext.tsx` - Canonical auth context using proper Supabase client
- ✅ `web/app/actions/login.ts` - Login action
- ✅ `web/app/api/auth/login/route.ts` - Login API route

#### **Poll System:**
- ✅ `web/lib/vote/engine.ts` - Complete voting engine with all methods
- ✅ `web/lib/vote/processor.ts` - Vote processor
- ✅ `web/shared/core/services/lib/poll-service.ts` - Complete poll service
- ✅ `web/features/polls/components/CreatePollForm.tsx` - Advanced poll creation form
- ✅ `web/features/voting/components/VotingInterface.tsx` - Complete voting interface

#### **Dashboard System:**
- ✅ `web/components/AnalyticsDashboard.tsx` - **ADMIN ANALYTICS** (comprehensive, feature-flagged)
- ✅ `web/components/Dashboard.tsx` - **USER DASHBOARD** (basic, E2E-ready)

#### **Database Schema:**
- ✅ `web/database/schema.sql` - Complete database schema
- ✅ `web/shared/core/database/supabase-schema.sql` - Enhanced schema
- ✅ `web/database/migrations/001_initial_schema.sql` - Initial migration
- ✅ `web/scripts/migrations/001-webauthn-schema.sql` - WebAuthn migration

#### **Supabase Clients:**
- ✅ `web/utils/supabase/server.ts` - SSR-safe server client with E2E bypass
- ✅ `web/utils/supabase/client.ts` - SSR-safe client with dynamic imports

#### **WebAuthn System:**
- ✅ `web/lib/webauthn/config.ts` - WebAuthn configuration
- ✅ `web/lib/webauthn/client.ts` - WebAuthn client
- ✅ `web/lib/webauthn/credential-verification.ts` - Complete verification

#### **UI Components:**
- ✅ `web/components/ui/index.ts` - Server-safe UI components barrel
- ✅ `web/components/ui/client.ts` - Client-only UI components barrel

#### **Performance Components:**
- ✅ `web/components/OptimizedImage.tsx` - Main optimized image component
- ✅ `web/components/VirtualScroll.tsx` - Main virtual scroll component
- ✅ `web/components/DeviceList.tsx` - Main device list component

#### **Feature Modules:**
- ✅ `web/features/civics/ingest/connectors/propublica.ts` - Main ProPublica connector

---

### **DISABLE (Legacy/Duplicates):**

#### **Authentication System Duplicates:**
- ❌ `web/components/auth/AuthProvider.tsx` - Basic fetch-based auth
- ❌ `web/hooks/AuthProvider.tsx` - Wrapper around useSupabaseAuth
- ❌ `web/hooks/useSupabaseAuth.ts` - Custom hook not used by canonical
- ❌ `web/lib/core/auth/auth.ts` - Basic implementation

#### **Poll System Duplicates:**
- ❌ `web/lib/services/poll-service.ts` - TODO implementation
- ❌ `web/components/polls/CreatePollForm.tsx` - Basic form
- ❌ `web/components/CreatePoll.tsx` - Basic component
- ❌ `web/components/polls/PollCreationSystem.tsx` - Duplicate system
- ❌ `web/features/polls/components/EnhancedVoteForm.tsx` - Duplicate voting form

#### **Dashboard System Duplicates:**
- ❌ `web/components/EnhancedDashboard.tsx` - **DUPLICATE** of user dashboard
- ❌ `web/features/dashboard/pages/dashboard/page.tsx` - Duplicate dashboard page

#### **Database Schema Duplicates:**
- ❌ `web/database/polls_schema.sql` - Partial schema
- ❌ `web/database/migrations/001_dual_track_results.sql` - Duplicate migration

#### **Supabase Client Duplicates:**
- ❌ `web/lib/supabase/server.ts` - Basic implementation
- ❌ `web/shared/core/database/lib/server.ts` - Duplicate of canonical
- ❌ `web/shared/lib/server.ts` - Exact duplicate
- ❌ `web/shared/core/database/lib/supabase-server.ts` - Incomplete implementation
- ❌ `web/utils/supabase/client-dynamic.ts` - Duplicate functionality
- ❌ `web/utils/supabase/client-minimal.ts` - Minimal implementation
- ❌ `web/lib/supabase-ssr-safe.ts` - Outdated approach
- ❌ `web/shared/core/database/lib/client.ts` - Basic implementation

#### **WebAuthn System Duplicates:**
- ❌ `web/features/webauthn/lib/webauthn.ts` - Feature-flagged WebAuthn
- ❌ `web/lib/shared/webauthn.ts` - Duplicate utilities
- ❌ `web/src/components/WebAuthnAuth.tsx` - Old implementation

#### **UI Component Duplicates:**
- ❌ `web/shared/components/index.ts` - Duplicate UI components

#### **Performance Component Duplicates:**
- ❌ `web/components/performance/OptimizedImage.tsx` - Duplicate of main implementation
- ❌ `web/components/performance/VirtualScroll.tsx` - Duplicate of main implementation
- ❌ `web/components/auth/DeviceList.tsx` - Duplicate of main implementation

#### **Feature Module Duplicates:**
- ❌ `web/features/civics/sources/propublica.ts` - Duplicate of main connector

---

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Critical System Duplicates (Immediate)**
```bash
# Authentication system duplicates (4 files)
mv web/components/auth/AuthProvider.tsx web/components/auth/AuthProvider.tsx.disabled
mv web/hooks/AuthProvider.tsx web/hooks/AuthProvider.tsx.disabled
mv web/hooks/useSupabaseAuth.ts web/hooks/useSupabaseAuth.ts.disabled
mv web/lib/core/auth/auth.ts web/lib/core/auth/auth.ts.disabled

# Poll system implementation duplicates (5 files)
mv web/lib/services/poll-service.ts web/lib/services/poll-service.ts.disabled
mv web/components/polls/CreatePollForm.tsx web/components/polls/CreatePollForm.tsx.disabled
mv web/components/CreatePoll.tsx web/components/CreatePoll.tsx.disabled
mv web/components/polls/PollCreationSystem.tsx web/components/polls/PollCreationSystem.tsx.disabled
mv web/features/polls/components/EnhancedVoteForm.tsx web/features/polls/components/EnhancedVoteForm.tsx.disabled

# Dashboard system duplicates (2 files)
mv web/components/EnhancedDashboard.tsx web/components/EnhancedDashboard.tsx.disabled
mv web/features/dashboard/pages/dashboard/page.tsx web/features/dashboard/pages/dashboard/page.tsx.disabled

# Database schema duplicates (2 files)
mv web/database/polls_schema.sql web/database/polls_schema.sql.disabled
mv web/database/migrations/001_dual_track_results.sql web/database/migrations/001_dual_track_results.sql.disabled
```

### **Phase 2: Supabase Client Duplicates (High Priority)**
```bash
# Supabase server client duplicates (8 files)
mv web/lib/supabase/server.ts web/lib/supabase/server.ts.disabled
mv web/shared/core/database/lib/server.ts web/shared/core/database/lib/server.ts.disabled
mv web/shared/lib/server.ts web/shared/lib/server.ts.disabled
mv web/shared/core/database/lib/supabase-server.ts web/shared/core/database/lib/supabase-server.ts.disabled
mv web/utils/supabase/client-dynamic.ts web/utils/supabase/client-dynamic.ts.disabled
mv web/utils/supabase/client-minimal.ts web/utils/supabase/client-minimal.ts.disabled
mv web/lib/supabase-ssr-safe.ts web/lib/supabase-ssr-safe.ts.disabled
mv web/shared/core/database/lib/client.ts web/shared/core/database/lib/client.ts.disabled
```

### **Phase 3: WebAuthn & UI Duplicates (Medium Priority)**
```bash
# WebAuthn implementation duplicates (3 files)
mv web/features/webauthn/lib/webauthn.ts web/features/webauthn/lib/webauthn.ts.disabled
mv web/lib/shared/webauthn.ts web/lib/shared/webauthn.ts.disabled
mv web/src/components/WebAuthnAuth.tsx web/src/components/WebAuthnAuth.tsx.disabled

# UI component system duplicates (1 file)
mv web/shared/components/index.ts web/shared/components/index.ts.disabled

# Performance component duplicates (3 files)
mv web/components/performance/OptimizedImage.tsx web/components/performance/OptimizedImage.tsx.disabled
mv web/components/performance/VirtualScroll.tsx web/components/performance/VirtualScroll.tsx.disabled
mv web/components/auth/DeviceList.tsx web/components/auth/DeviceList.tsx.disabled

# Feature module duplicates (1 file)
mv web/features/civics/sources/propublica.ts web/features/civics/sources/propublica.ts.disabled
```

---

## 🎯 **MVP DEPLOY STRATEGY**

### **Core User Journey (Must Work):**
1. **Landing** → `/` - Marketing page
2. **Authentication** → `/login`, `/register` - User auth
3. **Onboarding** → `/onboarding` - User setup
4. **Dashboard** → `/dashboard` - User metrics
5. **Poll Creation** → `/polls/create` - Create polls
6. **Voting** → `/polls/[id]` - Vote on polls
7. **Profile** → `/profile` - User management

### **Admin Journey (Must Work):**
1. **Admin Dashboard** → `/admin` - Admin overview
2. **Admin Analytics** → `/admin/analytics` - Comprehensive analytics (feature-flagged)

### **Feature Flags for Gradual Rollout:**
- `analytics` - Enable/disable analytics features
- `aiFeatures` - Enable/disable AI-powered insights
- `advancedAuth` - Enable/disable advanced auth features

---

## ✅ **SUCCESS CRITERIA**

1. **E2E Tests Pass** - All core user journey tests pass
2. **Build Success** - `npm run build` completes without errors
3. **Type Safety** - `npm run types:strict` passes
4. **Linting** - `npm run lint` passes
5. **No Import Errors** - All imports resolve to canonical files
6. **Feature Flags Work** - Analytics can be disabled if needed

---

**Status:** 🚀 **READY FOR IMPLEMENTATION**  
**Next Step:** Execute the disable commands and test the build
