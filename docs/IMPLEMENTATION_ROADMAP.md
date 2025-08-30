# Implementation Roadmap - Next.js 15 SSR Fixes
**Created:** August 30, 2025  
**Status:** 🎯 **READY FOR IMPLEMENTATION**

## 📊 **Scan Results Summary**

### **Critical Issues Found:**
- **18 Top-level Dynamic API calls** (Critical - must fix first)
- **19 Files need `dynamic = 'force-dynamic'`** (High Priority)
- **19 Server files importing `@supabase/supabase-js`** (High Priority)

## 🚀 **Phase 1: Critical Fixes (Week 1)**

### **1.1 Fix Top-level Dynamic API Calls (18 files)**

#### **API Routes (10 files)**
1. `web/app/api/auth/change-password/route.ts` - Move `cookies()` inside handler
2. `web/app/api/auth/delete-account/route.ts` - Move `cookies()` inside handler
3. `web/app/api/auth/forgot-password/route.ts` - Move `cookies()` inside handler
4. `web/app/api/auth/webauthn/authenticate/route.ts` - Move `cookies()` inside handler
5. `web/app/api/auth/webauthn/credentials/route.ts` - Move `cookies()` inside handler
6. `web/app/api/auth/webauthn/logs/route.ts` - Move `cookies()` inside handler
7. `web/app/api/auth/webauthn/register/route.ts` - Move `cookies()` inside handler
8. `web/app/api/feedback/route.ts` - Move `cookies()` inside handler
9. `web/app/api/user/get-id/route.ts` - Move `cookies()` inside handler
10. `web/app/api/user/get-id-public/route.ts` - Move `cookies()` inside handler

#### **Library Files (8 files)**
11. `web/lib/auth-middleware.ts` - Move `cookies()` inside function
12. `web/lib/media-bias-analysis.ts` - Move `cookies()` inside function
13. `web/lib/poll-narrative-system.ts` - Move `cookies()` inside function
14. `web/lib/rate-limit.ts` - Move `headers()` inside function
15. `web/lib/real-time-news-service.ts` - Move `cookies()` inside function
16. `web/lib/session.ts` - Move `cookies()` inside function
17. `web/middleware.ts` - Move `headers()` inside function
18. `web/next.config.js` - Move `headers()` inside function

### **1.2 Add Missing Dynamic Declarations (19 files)**

#### **API Routes (8 files)**
1. `web/app/api/auth/register-biometric/route.ts` - Add `export const dynamic = 'force-dynamic'`
2. `web/app/api/auth/register-ia/route.ts` - Add `export const dynamic = 'force-dynamic'`
3. `web/app/api/auth/webauthn/authenticate/route.ts` - Add `export const dynamic = 'force-dynamic'`
4. `web/app/api/auth/webauthn/register/route.ts` - Add `export const dynamic = 'force-dynamic'`
5. `web/app/api/onboarding/progress/route.ts` - Add `export const dynamic = 'force-dynamic'`
6. `web/app/api/privacy/preferences/route.ts` - Add `export const dynamic = 'force-dynamic'`
7. `web/app/api/user/complete-onboarding/route.ts` - Add `export const dynamic = 'force-dynamic'`
8. `web/app/api/admin/schema-status/route.ts` - Add `export const dynamic = 'force-dynamic'`

#### **Pages (1 file)**
9. `web/app/dashboard/page.tsx` - Add `export const dynamic = 'force-dynamic'`

#### **Library Files (10 files)**
10. `web/lib/auth/session-cookies.ts` - Add `export const dynamic = 'force-dynamic'`
11. `web/lib/auth-middleware.ts` - Add `export const dynamic = 'force-dynamic'`
12. `web/lib/hybrid-voting-service.ts` - Add `export const dynamic = 'force-dynamic'`
13. `web/lib/media-bias-analysis.ts` - Add `export const dynamic = 'force-dynamic'`
14. `web/lib/poll-narrative-system.ts` - Add `export const dynamic = 'force-dynamic'`
15. `web/lib/real-time-news-service.ts` - Add `export const dynamic = 'force-dynamic'`
16. `web/lib/session.ts` - Add `export const dynamic = 'force-dynamic'`
17. `web/lib/supabase-ssr-safe.ts` - Add `export const dynamic = 'force-dynamic'`
18. `web/utils/supabase/server.ts` - Add `export const dynamic = 'force-dynamic'`
19. `web/app/actions/register.ts` - Add `export const dynamic = 'force-dynamic'`

## 🔧 **Phase 2: Supabase SSR Client Migration (Week 2)**

### **2.1 Create New Supabase SSR Clients**

#### **New Files to Create:**
1. `web/utils/supabase/server-rsc.ts` - Server Components (read-only)
2. `web/utils/supabase/server-route.ts` - Route Handlers (read/write)
3. `web/utils/supabase/client.ts` - Browser client (updated)

### **2.2 Update Files with Incorrect Supabase Imports (19 files)**

#### **Test Files (8 files)**
1. `web/__tests__/actions/vote.test.ts` - Update to use new SSR clients
2. `web/__tests__/api/polls.test.ts` - Update to use new SSR clients
3. `web/__tests__/auth/AuthContext.test.tsx` - Update to use new SSR clients
4. `web/__tests__/schema/device-flow-hardening.test.ts` - Update to use new SSR clients
5. `web/__tests__/schema/dpop-token-binding.test.ts` - Update to use new SSR clients
6. `web/__tests__/schema/identity-unification.test.ts` - Update to use new SSR clients
7. `web/__tests__/schema/test-runner.ts` - Update to use new SSR clients
8. `web/__tests__/schema/webauthn-enhancement.test.ts` - Update to use new SSR clients

#### **API Routes (1 file)**
9. `web/app/api/admin/schema-status/route.ts` - Update to use new SSR clients

#### **Library Files (10 files)**
10. `web/lib/database-config.ts` - Update to use new SSR clients
11. `web/lib/dpop-middleware.ts` - Update to use new SSR clients
12. `web/lib/performance/optimized-poll-service.ts` - Update to use new SSR clients
13. `web/lib/privacy/differential-privacy.ts` - Update to use new SSR clients
14. `web/lib/supabase-optimized-examples.ts` - Update to use new SSR clients
15. `web/lib/supabase-performance.ts` - Update to use new SSR clients
16. `web/lib/supabase-server.ts` - Update to use new SSR clients
17. `web/lib/supabase-ssr-safe.ts` - Update to use new SSR clients
18. `web/utils/supabase/middleware.ts` - Update to use new SSR clients
19. `web/utils/supabase/server.ts` - Update to use new SSR clients

## ⚙️ **Phase 3: Configuration Cleanup (Week 3)**

### **3.1 Simplify Next.js Configuration**
- **File:** `web/next.config.js`
- **Tasks:**
  - Remove custom webpack plugins
  - Remove custom resolve configurations
  - Use `serverExternalPackages` instead of `serverComponentsExternalPackages`
  - Add `optimizePackageImports` for performance

### **3.2 Fix Instrumentation**
- **File:** `web/instrumentation.ts`
- **Tasks:**
  - Add runtime guards to all polyfills
  - Keep side-effects minimal
  - Test that self polyfill works correctly

### **3.3 Update Vercel Configuration**
- **File:** `vercel.json`
- **Tasks:**
  - Set root directory to `/web`
  - Remove unnecessary rewrites
  - Keep only essential environment variables

## 🧪 **Phase 4: Testing & Verification (Week 4)**

### **4.1 Update Test Suite**
- **Files:**
  - `web/tests/e2e/current-system-e2e.test.ts`
  - Unit tests (if any)

### **4.2 Local Development Testing**
- **Test Scenarios:**
  - `npm run dev` starts without errors
  - Pages render correctly with SSR
  - Authentication flow works
  - API routes function properly
  - No console errors or warnings

### **4.3 Production Build Testing**
- **Test Scenarios:**
  - `npm run build` completes successfully
  - `npm run start` works correctly
  - All pages render without SSR errors
  - Authentication flow works in production

## 📚 **Phase 5: Documentation & Deployment (Week 5)**

### **5.1 Update Documentation**
- **Files:**
  - `docs/PROJECT_STATUS.md`
  - `docs/testing/COMPREHENSIVE_TESTING_GUIDE.md`
  - `CONTRIBUTING.md`
  - `README.md`

### **5.2 Vercel Deployment**
- **Tasks:**
  - Update Vercel project settings
  - Set environment variables
  - Deploy and test
  - Monitor for any issues

## 🎯 **Implementation Strategy**

### **Day-by-Day Breakdown:**

#### **Week 1: Critical Fixes**
- **Day 1:** Fix top-level API calls in API routes (10 files)
- **Day 2:** Fix top-level API calls in library files (8 files)
- **Day 3:** Add dynamic declarations to API routes (8 files)
- **Day 4:** Add dynamic declarations to pages and library files (11 files)
- **Day 5:** Test and verify fixes

#### **Week 2: Supabase Migration**
- **Day 1:** Create new Supabase SSR clients
- **Day 2:** Update test files (8 files)
- **Day 3:** Update API routes and library files (11 files)
- **Day 4:** Test authentication flow
- **Day 5:** Verify all Supabase imports are correct

#### **Week 3: Configuration**
- **Day 1:** Simplify Next.js config
- **Day 2:** Fix instrumentation
- **Day 3:** Update Vercel config
- **Day 4:** Test configuration changes
- **Day 5:** Verify build process

#### **Week 4: Testing**
- **Day 1:** Update test suite
- **Day 2:** Local development testing
- **Day 3:** Production build testing
- **Day 4:** Fix any issues found
- **Day 5:** Final verification

#### **Week 5: Documentation & Deployment**
- **Day 1:** Update documentation
- **Day 2:** Deploy to Vercel
- **Day 3:** Final testing
- **Day 4:** Monitor and fix issues
- **Day 5:** Merge to main

## 🔄 **Rollback Strategy**

### **If Issues Arise:**
1. **Immediate Rollback:** `git reset --hard HEAD~1`
2. **Feature Branch Rollback:** `git checkout main && git branch -D feat/next15-ssr-fixes`
3. **Database Rollback:** If schema changes were made
4. **Environment Rollback:** If environment variables were changed

### **Rollback Triggers:**
- Build failures
- SSR errors in production
- Authentication flow broken
- E2E tests failing
- Performance regressions

## 📈 **Success Metrics**

### **Technical Metrics**
- ✅ No "cookies called outside request scope" errors
- ✅ No "self is not defined" errors
- ✅ Successful Vercel deployment
- ✅ All E2E tests passing
- ✅ Authentication flow working end-to-end
- ✅ Local development works without SSR errors

### **Development Metrics**
- ✅ Contributors can easily set up and run the project
- ✅ Documentation is current and helpful
- ✅ Build process completes successfully
- ✅ No performance regressions

## 🤔 **Open Questions**

1. **Custom JWT vs Supabase Auth:** Should we remove custom JWT implementation?
2. **Testing Strategy:** Should we test current state or intended functionality?
3. **Deployment Priority:** Focus on working deployment first or full features?
4. **Documentation Scope:** How detailed should contributing guide be?

## 📋 **Next Steps**

1. **Begin Phase 1** - Fix top-level Dynamic API calls
2. **Run scanner after each fix** to verify progress
3. **Test incrementally** to catch issues early
4. **Document progress** in this roadmap

---

**This roadmap will be updated as we progress through implementation phases.**
