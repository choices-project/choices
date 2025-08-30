# Vercel Deployment Fix Plan - August 30, 2025

## 🎯 **Executive Summary**

Based on comprehensive AI analysis, our Vercel deployment issues stem from two primary blockers:
1. **Project wiring on Vercel** (monorepo root vs /web directory structure)
2. **Static analysis conflicts** (routes/pages being marked static while calling cookies() outside request scope)

This document outlines a surgical, step-by-step implementation plan to resolve these issues.

---

## 📋 **Root Cause Analysis**

### **Issue 1: Monorepo Configuration**
- **Problem**: Vercel is trying to build from root directory instead of `/web`
- **Impact**: Build commands and API paths are misaligned
- **Solution**: Point Vercel project directly to `/web` directory

### **Issue 2: Static Generation vs Dynamic APIs**
- **Problem**: Next.js static analysis marks routes as static while they use `cookies()`/`headers()`
- **Impact**: "cookies was called outside a request scope" errors
- **Solution**: Mark dynamic routes and move API calls into request scope

---

## 🛠️ **Implementation Plan**

### **Phase 1: Vercel Project Configuration**

#### **Step 1A: Update Vercel Project Settings**
**Action**: Configure Vercel to use `/web` as root directory
- **Location**: Vercel Dashboard → Project → Settings → General → Root Directory
- **Change**: Set Root Directory to `web/`
- **Impact**: Eliminates need for custom build commands and rewrites

#### **Step 1B: Simplify vercel.json**
**Action**: Remove unnecessary configuration
- **Current**: Complex rewrites and output directory settings
- **Target**: Minimal configuration or delete file entirely
- **New vercel.json** (if kept):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "framework": "nextjs"
}
```

**Rationale**: Next.js preset handles `/app/api/**` → `/api/**` automatically

### **Phase 2: Next.js Configuration Cleanup**

#### **Step 2A: Consolidate Next.js Config**
**Action**: Keep only one Next.js configuration file
- **Remove**: Root `next.config.mjs` (if exists)
- **Keep**: `/web/next.config.js` only
- **Rationale**: Avoid conflicting configurations

#### **Step 2B: Simplify Next.js Config**
**Action**: Update `/web/next.config.js` to Next 14.2.x best practices
**Target Configuration**:
```javascript
// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@supabase/ssr',
      '@supabase/realtime-js',
      // ⚠️ do NOT list '@supabase/supabase-js' here; keep it client-only
    ],
    optimizePackageImports: [
      'lucide-react', 'date-fns', 'lodash-es', 'react-hook-form', 'zod', 'clsx', 'tailwind-merge',
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // temporary guard if a vendor still touches `self` at TLA
      config.plugins.push(new webpack.DefinePlugin({ self: 'globalThis' }));
    }
    return config;
  },
};
module.exports = nextConfig;
```

**Key Changes**:
- Remove complex webpack overrides (conditionNames, mainFields, fallbacks)
- Keep only essential SSR polyfill
- Remove bundle optimization complexity (can be added back later)

### **Phase 3: Fix Static Generation Issues**

#### **Step 3A: Mark Dynamic Routes**
**Action**: Add `export const dynamic = 'force-dynamic'` to all cookie-reading routes

**Files to Update**:
1. `web/app/api/admin/system-status/route.ts`
2. `web/app/api/admin/schema-status/route.ts`
3. `web/app/api/admin/feedback/export/route.ts`
4. `web/app/api/database-health/route.ts`
5. `web/app/dashboard/page.tsx`
6. `web/app/register/page.tsx`

**Pattern**:
```typescript
+ export const dynamic = 'force-dynamic';

- import { cookies } from 'next/headers';
- const store = await cookies(); // ❌ module scope

+ import { cookies } from 'next/headers';

export async function GET(request: Request) {
+  const store = cookies(); // ✅ inside request scope
  // ... use store.get(...)
}
```

#### **Step 3B: Move API Calls to Request Scope**
**Action**: Ensure all `cookies()`/`headers()` calls happen inside handlers/components

**Rules**:
- ❌ Never call at module top level
- ❌ Never call in files that run during build analysis
- ✅ Always call inside handler/component functions
- ✅ Use `export const dynamic = 'force-dynamic'` for auth/session routes

### **Phase 4: Supabase SSR Hygiene**

#### **Step 4A: Verify Server-Only Imports**
**Action**: Ensure server files only use `@supabase/ssr`, never `@supabase/supabase-js`

**Target Pattern**:
```typescript
// web/utils/supabase/server.ts
import 'server-only';
import { cookies } from 'next/headers';

export async function getSupabaseServerClient() {
  const env = validateEnvironment();
  const cookieStore = cookies(); // inside request scope when called
  const { createServerClient } = await import('@supabase/ssr');
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!, 
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        get: n => cookieStore.get(n)?.value, 
        set: () => {}, 
        remove: () => {} 
      } 
    }
  );
}
```

#### **Step 4B: Pin Runtime for Edge Compatibility**
**Action**: Add `export const runtime = 'nodejs'` to routes that might run on Edge

### **Phase 5: Verification & Testing**

#### **Step 5A: Local Testing**
**Commands to Run**:
```bash
cd web
npm run build
npm run lint
```

**Expected Results**:
- ✅ Build passes without errors
- ✅ Postbuild check (no browser globals) stays green
- ⚠️ ESLint warnings acceptable (non-blocking)

#### **Step 5B: Vercel Deployment Verification**
**Checkpoints**:
1. **Project Settings**: Root Directory = `web/`
2. **Build Logs**: Should show `[instrumentation] runtime= nodejs`
3. **No "outside request scope" errors**
4. **All cookie-reading routes marked dynamic**

#### **Step 5C: Add ESLint Guardrail**
**Action**: Add rule to prevent regressions
**File**: `web/.eslintrc.cjs`
```javascript
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "Program > ImportDeclaration[source.value='next/headers'] ~ ExpressionStatement > AwaitExpression > CallExpression[callee.name=/^(cookies|headers)$/]",
        message: 'Call cookies()/headers() inside a handler or component, not at module scope.',
      },
    ],
  },
};
```

---

## 🔍 **Quick Verification Commands**

### **Pre-Implementation Checks**:
```bash
# Check for server files importing browser client
rg -n "@supabase/supabase-js" web/ | rg -v "use client" || true

# Check for top-level cookies()/headers() calls
rg -n "cookies\(|headers\(" web/app web/utils | rg -v "use client" || true
```

### **Post-Implementation Verification**:
```bash
# Build should pass
cd web && npm run build

# No browser globals in server output
npm run postbuild

# Check for dynamic exports
rg -n "export const dynamic" web/app
```

---

## 📊 **Implementation Priority**

### **High Priority (Deployment Blocking)**:
1. ✅ Vercel Root Directory configuration
2. ✅ Simplify vercel.json
3. ✅ Mark dynamic routes
4. ✅ Move cookies() calls to request scope

### **Medium Priority (Performance/Optimization)**:
1. ⚠️ Simplify Next.js config
2. ⚠️ Add ESLint guardrails
3. ⚠️ Verify Supabase SSR hygiene

### **Low Priority (Future Improvements)**:
1. 🔄 Bundle optimization (can be added back later)
2. 🔄 Advanced webpack configurations
3. 🔄 Performance monitoring

---

## 🚨 **Risk Mitigation**

### **Rollback Plan**:
- **Git Branches**: All changes will be committed to feature branch first
- **Vercel Settings**: Can be reverted immediately in dashboard
- **Configuration**: Keep backups of current working configs

### **Testing Strategy**:
1. **Local Testing**: Verify all changes work locally first
2. **Staging Deployment**: Test on Vercel preview deployment
3. **Production Deployment**: Only after staging verification

---

## 📝 **Success Criteria**

### **Deployment Success**:
- ✅ Vercel build completes without errors
- ✅ No "cookies outside request scope" errors
- ✅ No "self is not defined" errors
- ✅ All routes function correctly

### **Performance Metrics**:
- ✅ Build time remains reasonable
- ✅ Bundle sizes optimized
- ✅ SSR functionality preserved
- ✅ Authentication flows work

### **Code Quality**:
- ✅ ESLint passes (warnings acceptable)
- ✅ TypeScript compilation clean
- ✅ No browser globals in server bundles
- ✅ Proper separation of client/server code

---

## 🎯 **Next Steps**

1. **Review Plan**: Confirm all steps are understood
2. **Create Feature Branch**: `git checkout -b fix/vercel-deployment`
3. **Implement Phase 1**: Vercel configuration changes
4. **Test Locally**: Verify build and functionality
5. **Deploy to Staging**: Test on Vercel preview
6. **Monitor Logs**: Check for instrumentation and error messages
7. **Iterate**: Address any remaining issues
8. **Merge to Main**: Deploy to production

---

**Status**: Ready for implementation
**Estimated Time**: 2-4 hours
**Risk Level**: Low (surgical changes with rollback capability)
**Dependencies**: Vercel dashboard access, git repository access
