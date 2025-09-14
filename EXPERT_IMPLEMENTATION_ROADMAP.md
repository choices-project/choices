# Expert Implementation Roadmap

**Created:** 2025-01-27  
**Status:** Ready for Implementation  
**Source:** Expert analysis of overhaul-intake-report.md

## Executive Summary

The expert has analyzed our archive and identified **4 critical blockers** preventing successful builds. They've provided **safe stub implementations** and a **clear action plan** to get the project compiling and building successfully.

## 🚨 Critical Issues Identified

### 1. **Missing Modules (Blocking TS Build)**
**Impact:** Complete build failure - TypeScript cannot resolve imports

**Missing Files:**
- `lib/ssr-safe.ts` - Missing `safeBrowserAccess` export
- `lib/feature-flags.ts` - Missing `featureFlagManager`, `enableFeature`, etc.
- `lib/supabase-ssr-safe.ts` - Missing `createBrowserClientSafe` export
- `utils/supabase/server.ts` - Missing `getSupabaseServerClient` export
- `hooks/useFeatureFlags.ts` - Referenced but missing
- `hooks/useSupabaseAuth.ts` - Referenced but missing
- `app/login/page.tsx` - Referenced but missing

### 2. **Path Alias Conflicts**
**Impact:** TypeScript resolution ambiguity

**Problem:**
```json
"@/lib/*": ["./lib/*", "./shared/utils/lib/*"]
```

**Solution:** Collapse to single source of truth:
```json
"@/lib/*": ["./lib/*"]
```

### 3. **Code Bug in Admin Route**
**Impact:** Runtime error in admin feedback API

**File:** `app/api/admin/feedback/route.ts`
**Issue:** `let query = supabaseClient` (undefined variable)
**Fix:** `let query = supabase` (from `const supabase = await getSupabaseServerClient()`)

### 4. **Import Normalization Needed**
**Impact:** Inconsistent import patterns across codebase

**Current Issues:**
- Mixed usage of `@/lib/*` vs `@/shared/utils/lib/*`
- Inconsistent Supabase client imports
- Admin auth imports need standardization

---

## 📋 Implementation Roadmap

### **Phase 1: Critical Fixes (Must Complete First)**

#### **Step 1.1: Create Missing Module Stubs**
**Priority:** 🔴 **CRITICAL** - Blocks all builds

**Files to Create:**

**`web/lib/ssr-safe.ts`**
```typescript
export const isBrowser = () => typeof window !== 'undefined';

export function safeBrowserAccess<T>(fn: () => T, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { return fn(); } catch { return fallback; }
}
```

**`web/lib/feature-flags.ts`**
```typescript
type FlagName = string;
const flags = new Map<FlagName, boolean>();

export const featureFlagManager = {
  getAll: () => Object.fromEntries(flags),
  set: (k: FlagName, v: boolean) => flags.set(k, v),
};

export function enableFeature(name: FlagName) { flags.set(name, true); }
export function disableFeature(name: FlagName) { flags.set(name, false); }
export function toggleFeature(name: FlagName) { flags.set(name, !Boolean(flags.get(name))); }
export function getFeatureFlag(name: FlagName) { return Boolean(flags.get(name)); }
export function getAllFeatureFlags() { return featureFlagManager.getAll(); }
```

**`web/lib/supabase-ssr-safe.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

export function createBrowserClientSafe(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) {
  if (typeof window === 'undefined') {
    throw new Error('createBrowserClientSafe is browser-only');
  }
  return createClient(url, anon);
}
```

**`web/utils/supabase/server.ts`**
```typescript
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) { return cookies().get(name)?.value; },
      set(name: string, value: string, options: CookieOptions) { cookies().set(name, value, options); },
      remove(name: string, options: CookieOptions) { cookies().set(name, '', { ...options, maxAge: 0 }); },
    },
  });
}
```

#### **Step 1.2: Fix TypeScript Path Aliases**
**Priority:** 🔴 **CRITICAL** - Resolves import conflicts

**File:** `web/tsconfig.json`

**Change:**
```json
"@/lib/*": ["./lib/*", "./shared/utils/lib/*"]
```

**To:**
```json
"@/lib/*": ["./lib/*"]
```

**Keep explicit aliases:**
```json
"@/utils/supabase/server": ["./utils/supabase/server"]
```

#### **Step 1.3: Fix Admin Route Bug**
**Priority:** 🔴 **CRITICAL** - Runtime error fix

**File:** `web/app/api/admin/feedback/route.ts`

**Find:**
```typescript
let query = supabaseClient
```

**Replace:**
```typescript
let query = supabase
```

#### **Step 1.4: Verify Build Success**
**Priority:** 🔴 **CRITICAL** - Confirm fixes work

**Commands:**
```bash
cd web
npm run type-check:strict
npm run build
```

**Expected Result:** ✅ Build succeeds without TypeScript errors

---

### **Phase 2: Import Normalization (Post-Build)**

#### **Step 2.1: Create Import Codemod**
**Priority:** 🟡 **HIGH** - Consistency improvement

**Target Patterns:**
- Normalize `@/lib/admin-auth` imports
- Standardize `@/utils/supabase/server` imports
- Remove `@/shared/utils/lib/*` imports that should be `@/lib/*`

#### **Step 2.2: Run Codemod**
**Priority:** 🟡 **HIGH** - Apply consistent patterns

**Scope:**
- All admin API routes
- All admin UI components
- All authentication-related files

#### **Step 2.3: Verify Import Consistency**
**Priority:** 🟡 **HIGH** - Ensure no regressions

**Commands:**
```bash
npm run type-check:strict
npm run build
npm test
```

---

### **Phase 3: Missing Hook Files (If Needed)**

#### **Step 3.1: Assess Hook Dependencies**
**Priority:** 🟢 **MEDIUM** - Complete missing references

**Files to Evaluate:**
- `hooks/useFeatureFlags.ts` - Create if referenced by pages
- `hooks/useSupabaseAuth.ts` - Create if referenced by pages
- `app/login/page.tsx` - Create if referenced by admin system

#### **Step 3.2: Create Hook Stubs (If Required)**
**Priority:** 🟢 **MEDIUM** - Complete the interface

**Approach:**
- Simple wrappers that call the lib functions
- Or temporarily comment imports until real implementations

---

### **Phase 4: Advanced Improvements (Future)**

#### **Step 4.1: Alias Health Check**
**Priority:** 🔵 **LOW** - Prevent future drift

**Implementation:**
- Add CI script that fails if any alias maps to multiple roots
- Pre-merge gate for alias validation

#### **Step 4.2: Folder Layout Optimization**
**Priority:** 🔵 **LOW** - Long-term architecture

**Expert Suggestion:**
- Feature-first layout with thin `lib/` for cross-cutting utilities
- Cleaner separation of concerns

#### **Step 4.3: Documentation Skeleton**
**Priority:** 🔵 **LOW** - Project maintainability

**Components:**
- ADR (Architecture Decision Records)
- Feature notes
- "What changed this week" log

---

## 🎯 Success Criteria

### **Phase 1 Success:**
- ✅ `npm run type-check:strict` passes
- ✅ `npm run build` succeeds
- ✅ All admin routes compile without errors
- ✅ No missing module errors

### **Phase 2 Success:**
- ✅ Consistent import patterns across codebase
- ✅ No `@/shared/utils/lib/*` imports in admin code
- ✅ All tests still pass
- ✅ Build remains successful

### **Overall Success:**
- ✅ Production-ready build
- ✅ Admin system fully functional
- ✅ Clean, maintainable codebase
- ✅ No TypeScript errors

---

## 🚀 Implementation Order

1. **Create missing module stubs** (Step 1.1)
2. **Fix TypeScript path aliases** (Step 1.2)
3. **Fix admin route bug** (Step 1.3)
4. **Verify build success** (Step 1.4)
5. **Run import normalization** (Step 2.1-2.3)
6. **Handle missing hooks** (Step 3.1-3.2)
7. **Advanced improvements** (Step 4.1-4.3)

---

## 📊 Risk Assessment

### **Low Risk:**
- Creating stub modules (safe, non-breaking)
- Fixing path aliases (well-defined change)
- Fixing variable name bug (simple fix)

### **Medium Risk:**
- Import normalization (requires careful testing)
- Missing hook creation (may need real implementations)

### **High Risk:**
- None identified - expert provided safe, incremental approach

---

## 🔧 Expert Support Available

The expert has offered additional support:

1. **Auto-generate stubs** - Can produce ready-to-apply patch files
2. **Codemod creation** - Can generate import normalization scripts
3. **Folder layout proposal** - Can suggest leaner architecture
4. **Documentation skeleton** - Can create ADR and feature docs
5. **Pre-merge gates** - Can add alias validation to CI

---

## 📝 Next Steps

1. **Review this roadmap** with the team
2. **Request expert to generate patch files** for Phase 1
3. **Execute Phase 1** (critical fixes)
4. **Validate build success**
5. **Proceed with Phase 2** (import normalization)
6. **Plan Phase 3-4** based on Phase 1-2 results

---

**Status:** Ready for implementation  
**Expert Available:** Yes - can provide patch files and codemods  
**Estimated Time:** Phase 1 (1-2 hours), Phase 2 (2-3 hours), Phase 3-4 (future)
