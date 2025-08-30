# Implementation Plan of Attack - Next.js 15 SSR Fixes
**Created:** August 30, 2025  
**Status:** 🎯 **PLANNING PHASE - NO WORKING YET**

## 🎯 **Executive Summary**

This document outlines the comprehensive plan to fix Next.js 15 SSR issues in the Choices platform, based on the AI analysis in `web/docs/ai-analysis.md`. The plan follows a phased approach with clear success criteria and rollback strategies.

## 📊 **Current State Assessment**

### **Scan Results (from tools/scan-next-dynamic-simple.mjs)**
**Critical Issues Found:**
1. **18 Top-level Dynamic API calls** - `cookies()` and `headers()` called at module scope
2. **19 Files need `dynamic = 'force-dynamic'`** - Routes using cookies without proper declaration
3. **19 Server files importing `@supabase/supabase-js`** - Should use `@supabase/ssr` instead

### **Detailed Findings:**

#### **Top-level Dynamic API Calls (Critical)**
- **API Routes:** 10 files with top-level `cookies()` calls
- **Library Files:** 8 files with top-level `cookies()` or `headers()` calls
- **Files affected:** `web/app/api/auth/*`, `web/lib/*`, `web/middleware.ts`

#### **Missing Dynamic Declarations (High Priority)**
- **API Routes:** 8 files need `export const dynamic = 'force-dynamic'`
- **Pages:** 1 file (`web/app/dashboard/page.tsx`)
- **Library Files:** 10 files need dynamic declarations
- **Files affected:** `web/app/api/*`, `web/lib/*`, `web/utils/supabase/*`

#### **Incorrect Supabase Imports (High Priority)**
- **Test Files:** 8 files importing `@supabase/supabase-js` in server context
- **API Routes:** 1 file with incorrect import
- **Library Files:** 10 files with incorrect imports
- **Files affected:** `web/__tests__/*`, `web/lib/*`, `web/utils/supabase/*`

### **Known Issues (from AI Analysis)**
1. **Async Cookies() Violations** - Using `cookies()` synchronously or at module scope
2. **Supabase SSR Client Issues** - Using old `@supabase/auth-helpers-nextjs` instead of `@supabase/ssr`
3. **Static Generation Conflicts** - Routes using cookies without `dynamic = 'force-dynamic'`
4. **Webpack Configuration Problems** - Complex overrides causing SSR issues
5. **Vercel Monorepo Configuration** - Suboptimal setup for Next.js deployment

### **Success Criteria**
- ✅ No "cookies called outside request scope" errors
- ✅ No "self is not defined" errors  
- ✅ Successful Vercel deployment
- ✅ All E2E tests passing
- ✅ Authentication flow working end-to-end

## 🚀 **Phase 1: Assessment & Scanning (Week 1)**

### **1.1 Setup Scanning Tools**
**Objective:** Understand the exact scope of issues before making changes

**Tasks:**
1. **Create scanning tool** (`tools/scan-next-dynamic.mjs`)
2. **Install dependencies** (`@babel/parser`, `@babel/traverse`)
3. **Run initial scan** to identify all problematic files
4. **Document findings** in this plan

**Deliverables:**
- Complete scan report
- List of files requiring changes
- Prioritized fix order

### **1.2 Create Backup Strategy**
**Objective:** Ensure we can rollback if needed

**Tasks:**
1. **Create feature branch** `feat/next15-ssr-fixes`
2. **Document current state** in commit messages
3. **Create rollback checklist**

**Deliverables:**
- Feature branch ready for development
- Rollback procedures documented

## 🔧 **Phase 2: Core SSR Fixes (Week 2)**

### **2.1 Implement New Supabase SSR Clients**
**Objective:** Replace old Supabase clients with Next.js 15 compatible versions

**Files to Create/Modify:**
- `web/utils/supabase/server-rsc.ts` (Server Components - read-only)
- `web/utils/supabase/server-route.ts` (Route Handlers - read/write)
- `web/utils/supabase/client.ts` (Browser client)

**Implementation Strategy:**
1. Create new files alongside existing ones
2. Update imports gradually
3. Test each client type individually
4. Remove old files after verification

### **2.2 Fix Async Cookies() Usage**
**Objective:** Ensure all cookies() calls are properly awaited and in correct scope

**Files to Update:**
- All pages using cookies (identified by scanner)
- All API routes using cookies
- Middleware files

**Implementation Strategy:**
1. Add `export const dynamic = 'force-dynamic'` to affected files
2. Add `export const runtime = 'nodejs'` where needed
3. Ensure all `cookies()` calls are awaited
4. Move any top-level calls into functions

### **2.3 Update Authentication Flow**
**Objective:** Fix registration and login to use new SSR clients

**Files to Update:**
- `web/app/api/auth/register/route.ts`
- `web/app/register/page.tsx`
- `web/app/login/page.tsx` (if exists)
- `web/middleware.ts`

**Implementation Strategy:**
1. Update API routes to use `getSupabaseServerRoute()`
2. Update pages to use `getSupabaseServerRSC()`
3. Test authentication flow end-to-end
4. Verify cookie setting/reading works correctly

## ⚙️ **Phase 3: Configuration Cleanup (Week 3)**

### **3.1 Simplify Next.js Configuration**
**Objective:** Remove problematic webpack overrides and use Next.js 15 defaults

**Files to Update:**
- `web/next.config.js`

**Implementation Strategy:**
1. Remove custom webpack plugins
2. Remove custom resolve configurations
3. Use `serverExternalPackages` instead of `serverComponentsExternalPackages`
4. Add `optimizePackageImports` for performance

### **3.2 Fix Instrumentation**
**Objective:** Ensure instrumentation doesn't conflict with SSR

**Files to Update:**
- `web/instrumentation.ts`

**Implementation Strategy:**
1. Add runtime guards to all polyfills
2. Keep side-effects minimal
3. Test that self polyfill works correctly
4. Verify no SSR conflicts

### **3.3 Update Vercel Configuration**
**Objective:** Optimize for monorepo deployment

**Files to Update:**
- `vercel.json`

**Implementation Strategy:**
1. Set root directory to `/web`
2. Remove unnecessary rewrites
3. Keep only essential environment variables
4. Test deployment configuration

## 🧪 **Phase 4: Testing & Verification (Week 4)**

### **4.1 Update Test Suite**
**Objective:** Ensure tests work with new authentication flow

**Files to Update:**
- `web/tests/e2e/current-system-e2e.test.ts`
- Unit tests (if any)

**Implementation Strategy:**
1. Update E2E tests to match new flow
2. Test authentication scenarios
3. Test SSR rendering
4. Verify all tests pass

### **4.2 Local Development Testing**
**Objective:** Ensure development environment works correctly

**Test Scenarios:**
1. `npm run dev` starts without errors
2. Pages render correctly with SSR
3. Authentication flow works
4. API routes function properly
5. No console errors or warnings

### **4.3 Production Build Testing**
**Objective:** Ensure production build works correctly

**Test Scenarios:**
1. `npm run build` completes successfully
2. `npm run start` works correctly
3. All pages render without SSR errors
4. Authentication flow works in production

## 📚 **Phase 5: Documentation & Deployment (Week 5)**

### **5.1 Update Documentation**
**Objective:** Keep documentation current with implementation

**Files to Update:**
- `docs/PROJECT_STATUS.md`
- `docs/testing/COMPREHENSIVE_TESTING_GUIDE.md`
- `CONTRIBUTING.md`
- `README.md`

**Implementation Strategy:**
1. Update project status to reflect fixes
2. Add setup instructions for contributors
3. Document new authentication flow
4. Add troubleshooting section

### **5.2 Vercel Deployment**
**Objective:** Deploy successfully to Vercel

**Implementation Strategy:**
1. Update Vercel project settings
2. Set environment variables
3. Deploy and test
4. Monitor for any issues

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

## 🎯 **Implementation Order**

### **Week 1: Assessment**
- [ ] Setup scanning tool
- [ ] Run initial scan
- [ ] Create feature branch
- [ ] Document findings

### **Week 2: Core Fixes**
- [ ] Implement new Supabase SSR clients
- [ ] Fix async cookies() usage
- [ ] Update authentication flow
- [ ] Test core functionality

### **Week 3: Configuration**
- [ ] Simplify Next.js config
- [ ] Fix instrumentation
- [ ] Update Vercel config
- [ ] Test configuration changes

### **Week 4: Testing**
- [ ] Update test suite
- [ ] Local development testing
- [ ] Production build testing
- [ ] Fix any issues found

### **Week 5: Documentation & Deployment**
- [ ] Update documentation
- [ ] Deploy to Vercel
- [ ] Final testing
- [ ] Merge to main

## 🤔 **Open Questions**

1. **Custom JWT vs Supabase Auth:** Should we remove custom JWT implementation?
2. **Testing Strategy:** Should we test current state or intended functionality?
3. **Deployment Priority:** Focus on working deployment first or full features?
4. **Documentation Scope:** How detailed should contributing guide be?

## 📋 **Next Steps**

1. **Create scanning tool** and run initial assessment
2. **Create feature branch** for development
3. **Begin Phase 1** implementation
4. **Document progress** in this plan

---

**This plan will be updated as we progress through implementation phases.**
