# Next.js 14 SSR Implementation Plan
**Created:** August 30, 2025  
**Status:** 🎯 **READY FOR IMPLEMENTATION - Next.js 14 Specific**

## 📊 **Next.js 14 Scan Results**

### **Critical Issues Found:**
- **15 files using `await cookies()`** (Critical - wrong in Next.js 14)
- **19 files importing `@supabase/supabase-js`** on server (High Priority)
- **Multiple build errors** - Browser/Node globals in wrong contexts

### **Key Differences from Next.js 15:**
- ✅ **Next.js 14:** `cookies()` is **synchronous** (no `await` needed)
- ✅ **Next.js 14:** No `dynamic = 'force-dynamic'` requirement for cookies
- ✅ **Next.js 14:** Different SSR patterns and limitations

## 🚀 **Phase 1: Fix Async Cookies() Usage (Critical)**

### **Files to Fix (15 files):**

#### **API Routes (11 files)**
1. `web/app/api/auth/change-password/route.ts` - Remove `await` from `cookies()`
2. `web/app/api/auth/delete-account/route.ts` - Remove `await` from `cookies()`
3. `web/app/api/auth/forgot-password/route.ts` - Remove `await` from `cookies()`
4. `web/app/api/auth/sync-user/route.ts` - Remove `await` from `cookies()`
5. `web/app/api/auth/webauthn/authenticate/route.ts` - Remove `await` from `cookies()`
6. `web/app/api/auth/webauthn/credentials/route.ts` - Remove `await` from `cookies()`
7. `web/app/api/auth/webauthn/logs/route.ts` - Remove `await` from `cookies()`
8. `web/app/api/auth/webauthn/register/route.ts` - Remove `await` from `cookies()`
9. `web/app/api/auth/webauthn/trust-score/route.ts` - Remove `await` from `cookies()`
10. `web/app/api/dashboard/route.ts` - Remove `await` from `cookies()`
11. `web/app/api/feedback/route.ts` - Remove `await` from `cookies()`

#### **Pages and Library Files (4 files)**
12. `web/app/api/user/get-id/route.ts` - Remove `await` from `cookies()`
13. `web/app/api/user/get-id-public/route.ts` - Remove `await` from `cookies()`
14. `web/app/dashboard/page.tsx` - Remove `await` from `cookies()`
15. `web/lib/auth-middleware.ts` - Remove `await` from `cookies()`

### **Implementation Strategy:**
```typescript
// ❌ Wrong in Next.js 14:
const cookieStore = await cookies()

// ✅ Correct in Next.js 14:
const cookieStore = cookies()
```

## 🔧 **Phase 2: Fix Supabase SSR Client Usage (High Priority)**

### **Files to Update (19 files):**

#### **Test Files (8 files)**
1. `web/__tests__/actions/vote.test.ts` - Update to use `@supabase/ssr`
2. `web/__tests__/api/polls.test.ts` - Update to use `@supabase/ssr`
3. `web/__tests__/auth/AuthContext.test.tsx` - Update to use `@supabase/ssr`
4. `web/__tests__/schema/device-flow-hardening.test.ts` - Update to use `@supabase/ssr`
5. `web/__tests__/schema/dpop-token-binding.test.ts` - Update to use `@supabase/ssr`
6. `web/__tests__/schema/identity-unification.test.ts` - Update to use `@supabase/ssr`
7. `web/__tests__/schema/test-runner.ts` - Update to use `@supabase/ssr`
8. `web/__tests__/schema/webauthn-enhancement.test.ts` - Update to use `@supabase/ssr`

#### **API Routes (1 file)**
9. `web/app/api/admin/schema-status/route.ts` - Update to use `@supabase/ssr`

#### **Library Files (10 files)**
10. `web/lib/database-config.ts` - Update to use `@supabase/ssr`
11. `web/lib/dpop-middleware.ts` - Update to use `@supabase/ssr`
12. `web/lib/performance/optimized-poll-service.ts` - Update to use `@supabase/ssr`
13. `web/lib/privacy/differential-privacy.ts` - Update to use `@supabase/ssr`
14. `web/lib/supabase-optimized-examples.ts` - Update to use `@supabase/ssr`
15. `web/lib/supabase-performance.ts` - Update to use `@supabase/ssr`
16. `web/lib/supabase-server.ts` - Update to use `@supabase/ssr`
17. `web/lib/supabase-ssr-safe.ts` - Update to use `@supabase/ssr`
18. `web/utils/supabase/middleware.ts` - Update to use `@supabase/ssr`
19. `web/utils/supabase/server.ts` - Update to use `@supabase/ssr`

### **Implementation Strategy:**
```typescript
// ❌ Wrong for server:
import { createClient } from '@supabase/supabase-js'

// ✅ Correct for server:
import { createServerClient } from '@supabase/ssr'
```

## ⚙️ **Phase 3: Fix Build Errors (Medium Priority)**

### **Client Components with Node.js Globals (3 files):**
1. `web/utils/supabase/client-dynamic.ts` - Remove Node.js globals
2. `web/utils/supabase/client-minimal.ts` - Remove Node.js globals
3. `web/utils/supabase/client.ts` - Remove Node.js globals

### **Server Components with Browser Globals (Multiple files):**
- Various test files and utility files need `'use client'` directive or refactoring

## 🧪 **Phase 4: Testing & Verification**

### **4.1 Run Scanner After Each Fix**
```bash
node tools/scan-next14-ssr.mjs
```

### **4.2 Test Build Process**
```bash
cd web && npm run build
```

### **4.3 Test Development Server**
```bash
cd web && npm run dev
```

## 📚 **Phase 5: Documentation Updates**

### **Files to Update:**
- `docs/PROJECT_STATUS.md` - Update to reflect Next.js 14 fixes
- `docs/testing/COMPREHENSIVE_TESTING_GUIDE.md` - Update testing procedures
- `CONTRIBUTING.md` - Add Next.js 14 specific setup instructions

## 🎯 **Implementation Order**

### **Week 1: Critical Fixes**
- **Day 1:** Fix async cookies() in API routes (11 files)
- **Day 2:** Fix async cookies() in pages and library files (4 files)
- **Day 3:** Test and verify cookies() fixes
- **Day 4:** Update Supabase imports in test files (8 files)
- **Day 5:** Update Supabase imports in API routes and library files (11 files)

### **Week 2: Build Fixes & Testing**
- **Day 1:** Fix client components with Node.js globals (3 files)
- **Day 2:** Fix server components with browser globals
- **Day 3:** Test build process
- **Day 4:** Test development server
- **Day 5:** Update documentation

## 🔄 **Rollback Strategy**

### **If Issues Arise:**
1. **Immediate Rollback:** `git reset --hard HEAD~1`
2. **Feature Branch Rollback:** `git checkout main && git branch -D feat/next14-ssr-fixes`
3. **Environment Rollback:** If environment variables were changed

### **Rollback Triggers:**
- Build failures
- SSR errors in development
- Authentication flow broken
- E2E tests failing

## 📈 **Success Metrics**

### **Technical Metrics**
- ✅ No `await cookies()` usage (Next.js 14 compatible)
- ✅ All server files use `@supabase/ssr` instead of `@supabase/supabase-js`
- ✅ Successful build process
- ✅ Development server starts without errors
- ✅ No browser/Node globals in wrong contexts

### **Development Metrics**
- ✅ Contributors can easily set up and run the project
- ✅ Documentation is current and helpful
- ✅ Build process completes successfully

## 🤔 **Key Questions for Next.js 14**

1. **Supabase Client Strategy:** Should we use `@supabase/ssr` for all server-side code?
2. **Authentication Flow:** Should we keep the current authentication approach or simplify?
3. **Testing Strategy:** Should we update tests to match Next.js 14 patterns?
4. **Deployment Priority:** Focus on working deployment first or full features?

## 📋 **Next Steps**

1. **Begin Phase 1** - Fix async cookies() usage
2. **Run scanner after each fix** to verify progress
3. **Test incrementally** to catch issues early
4. **Document progress** in this plan

---

**This plan addresses actual Next.js 14 issues, not Next.js 15 breaking changes.**
