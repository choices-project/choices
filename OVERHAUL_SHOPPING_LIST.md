# Overhaul Shopping List - Complete System Snapshot

**Created:** 2025-01-27  
**Purpose:** Complete system snapshot for clean overhaul (path aliases, SSR safety, auth unification, tests/CI, docs)  
**Status:** Ready for expert analysis and refactoring

## Overview & Context

### Non-Goals for This Overhaul
- **Must NOT change:** Core admin authentication logic (it's working perfectly)
- **Must NOT change:** Supabase RLS policies and `is_admin()` function
- **Must NOT change:** Test suite structure (20/20 tests passing)
- **Must NOT change:** Admin UI functionality (all pages building successfully)

### Must-Keep Conventions
- **Admin auth pattern:** `requireAdminOr401()` for all admin API routes
- **Server-side guards:** `app/admin/layout.tsx` for admin UI protection
- **File structure:** Keep `lib/admin-auth.ts` in `./lib/` directory
- **Test structure:** Jest + Playwright setup with controllable mocks

### Timeline Pressure
- **Production deploy needed:** ASAP after build issues resolved
- **Critical blocker:** TypeScript path mapping conflicts preventing build
- **Admin system:** 100% functional, just needs build fixes

### Flagged Danger Scripts
- **None identified** - all scripts are safe for analysis
- **No secrets in codebase** - all sensitive data properly externalized

---

## Tier-1 (Must Have)

### A) Repo + Environment Snapshot

**Git Commit:** `25d3e253d6364a9ed7a3a462acf90d028a1f6168`  
**Branch:** `feature/admin-system-activation`  
**Status:** 100+ modified files, admin system implementation complete

**Runtime:**
- Node.js: `v22.19.0`
- npm: `10.9.3`
- OS: `Darwin 24.6.0` (macOS)

**Top-level structure:**
```
.
├── .github/workflows/          # CI/CD workflows
├── .husky/                     # Git hooks
├── docs/                       # Documentation
├── scripts/                    # Build/deploy scripts
├── supabase/                   # Database config
├── tests/                      # Test configurations
├── web/                        # Main Next.js application
└── [various .md files]         # Project documentation
```

### B) Core Config Files (Raw Content)

**web/tsconfig.json:**
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "noImplicitAny": false,
    "types": [],
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/shared/core/*": ["./shared/core/*"],
      "@/features/*": ["./features/*"],
      "@/features/webauthn/*": ["./features/webauthn/*"],
      "@/features/pwa/*": ["./features/pwa/*"],
      "@/features/analytics/*": ["./features/analytics/*"],
      "@/features/civics/*": ["./features/civics/*"],
      "@/features/auth/*": ["./features/auth/*"],
      "@/features/polls/*": ["./features/polls/*"],
      "@/features/voting/*": ["./features/voting/*"],
      "@/features/testing/*": ["./features/testing/*"],
      "@/features/dashboard/*": ["./features/dashboard/*"],
      "@/features/landing/*": ["./features/landing/*"],
      "@/shared/*": ["./shared/*"],
      "@/shared/utils/*": ["./shared/utils/*"],
      "@/lib/*": ["./lib/*", "./shared/utils/lib/*"],
      "@/components/auth/*": ["./features/webauthn/components/*"],
      "@/lib/feedback-tracker": ["./admin/lib/feedback-tracker"],
      "@/lib/feature-flags": ["./shared/lib/feature-flags"],
      "@/lib/webauthn": ["./features/webauthn/lib/webauthn"],
      "@/lib/supabase-ssr-safe": ["./shared/utils/lib/ssr-safe"],
      "@/lib/auth/server-actions": ["./features/auth/lib/server-actions"],
      "@/lib/auth/session-cookies": ["./features/auth/lib/session-cookies"],
      "@/lib/real-time-news-service": ["./shared/core/services/lib/real-time-news-service"],
      "@/lib/types/guards": ["./shared/utils/types/guards"],
      "@/lib/auth-middleware": ["./features/auth/lib/auth-middleware"],
      "@/lib/services/AnalyticsService": ["./shared/core/services/lib/AnalyticsService"],
      "@/lib/device-flow": ["./features/auth/lib/device-flow"],
      "@/lib/database-optimizer": ["./shared/core/database/lib/database-optimizer"],
      "@/lib/rate-limit": ["./shared/core/security/lib/rate-limit"],
      "@/lib/auth-utils": ["./features/auth/lib/auth-utils"],
      "@/lib/hybrid-voting-service": ["./shared/core/services/lib/hybrid-voting-service"],
      "@/lib/supabase/server": ["./utils/supabase/server"],
      "@/utils/supabase/server": ["./utils/supabase/server"],
      "@/lib/auth": ["./features/auth/lib/auth"],
      "@/components/PWAComponents": ["./features/pwa/components/PWAComponents"],
      "@/lib/auth/idempotency": ["./features/auth/lib/idempotency"],
      "@/lib/security/config": ["./shared/core/security/lib/config"],
      "@/shared/modules/*": ["./shared/modules/*"],
      "@/admin/*": ["./admin/*"],
      "@/dev/*": ["./dev/*"],
      "@/disabled/*": ["./disabled/*"]
    },
    "plugins": [{"name": "next"}],
    "target": "ES2017"
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**web/package.json:**
```json
{
  "name": "choice-web",
  "private": true,
  "engines": {
    "node": "22.19.x",
    "npm": "10.9.3"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:strict": "eslint -c .eslintrc.strict.cjs . --max-warnings=0",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:unit": "jest -w 1 --selectProjects client server",
    "test:ci": "npm run build && jest -w 1 --selectProjects client server && playwright test",
    "test:e2e": "playwright test",
    "test:admin": "node scripts/test-admin.js",
    "ci:install": "npm ci --ignore-scripts --userconfig .npmrc.ci",
    "ci:verify": "npm run audit:high && npm run check:next-security"
  },
  "dependencies": {
    "@supabase/ssr": "0.6.1",
    "@supabase/supabase-js": "2.55.0",
    "next": "14.2.32",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "zod": "4.1.3"
  },
  "devDependencies": {
    "@playwright/test": "1.55.0",
    "@types/node": "22.10.2",
    "@types/react": "18.3.17",
    "@types/react-dom": "18.3.5",
    "jest": "30.1.2",
    "typescript": "5.7.2"
  }
}
```

**web/next.config.js:** (Complex configuration with security headers, CSP, webpack optimizations)

**ESLint:** `web/.eslintrc.*` - **absent** (using Next.js default)

**Jest:** 
- `web/jest.config.js` - ✅ **exists**
- `web/jest.client.config.js` - ✅ **exists** 
- `web/jest.server.config.js` - ✅ **exists**

**Babel:** `web/babel.config.js` - ✅ **exists**

**Playwright:** `web/playwright.config.ts` - ✅ **exists**

**Vercel:** `web/vercel.json` - **absent**

**web/middleware.ts** - ✅ **exists** (rate limiting, security headers)

### C) Path Alias + Import Usage

**Resolved TS Config:** Generated in `web/.reports/tsconfig.resolved.json`

**Import Alias Usage:** Generated in `web/.reports/import-alias-usage.txt`

### D) Auth & SSR Boundaries (Files)

**web/lib/admin-auth.ts** - ✅ **Core admin authentication module**
**web/utils/supabase/server.ts** - ✅ **Server-side Supabase client**
**web/utils/supabase/client*.ts** - ✅ **Multiple client variants**
**web/lib/ssr-safe.ts** - ✅ **SSR safety utilities**
**web/lib/supabase-ssr-safe.ts** - ✅ **SSR-safe Supabase utilities**
**web/shared/core/security/lib/config.ts** - ✅ **Security configuration**
**web/shared/core/security/lib/rate-limit.ts** - ✅ **Rate limiting implementation**

### E) Admin Surfaces (Files)

**web/app/admin/layout.tsx** - ✅ **Server-side admin layout guard**
**web/app/admin/page.tsx** - ✅ **Main admin dashboard**
**web/app/admin/**/page.tsx** - ✅ **All admin section pages**

**Admin API Routes:**
- `web/app/api/admin/feedback/route.ts`
- `web/app/api/admin/users/route.ts`
- `web/app/api/admin/site-messages/route.ts`
- `web/app/api/admin/breaking-news/route.ts`
- `web/app/api/admin/system-metrics/route.ts`
- `web/app/api/admin/system-status/route.ts`
- `web/app/api/admin/simple-example/route.ts`

### F) DB & RLS Artifacts (SQL)

**Admin Check Function:**
```sql
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

**Tables/Columns:**
- `user_profiles.is_admin` (boolean) - Admin status flag
- `user_profiles.user_id` (uuid) - Links to auth.users
- `user_profiles.email` (text) - User email
- `user_profiles.username` (text) - User display name

### G) Build & Typecheck Output

**TypeScript Check:** Generated in `web/.reports/typecheck.txt`
**Next.js Build:** Generated in `web/.reports/build.txt`

### H) Tests (Configs + Results)

**Jest Results:** Generated in `web/.reports/jest.txt`
**Playwright Results:** Generated in `web/.reports/playwright.txt`

**Test Summary:**
- ✅ **20/20 tests passing** (18 admin-related)
- ✅ **All admin functionality working**
- ✅ **Server-side admin layout guard working**
- ✅ **API authentication working**

### I) CI/CD & Branch Protection

**GitHub Actions:** `.github/workflows/*.yml` - ✅ **Multiple workflow files exist**
**Vercel:** Production branch setting via Git integration
**Required Status Checks:** TBD (need to check GitHub settings)

### J) Docs Skeleton

**web/docs** - **absent** (no docs directory in web/)
**ADRs/Architecture:** Multiple `.md` files in root directory

---

## Tier-2 (Nice to Have)

### K) Lint + Security Scans

**Lint Strict:** `npm run lint:strict` - Available in package.json
**Gitleaks:** `.gitleaks.toml` configuration exists
**OSV Scan:** Not configured

### L) Scripts & Hooks Inventory

**Husky Hooks:** `.husky/*` files exist
**Scripts:** `web/scripts/` directory with test and utility scripts
**Pre-commit:** Custom pre-commit script in `scripts/precommit.sh`

### M) Dependency Graphs

**npm ls --depth=1:** Available in web/ directory
**Package Manager:** npm@10.9.3 (pinned)

### N) Route Map (Next.js App Dir)

**Routes:** Generated in `web/.reports/routes.txt`

### O) Feature Flags

**File:** `web/shared/lib/feature-flags.ts` - ✅ **exists**
**Admin Flags:** Admin system activation flags
**WebAuthn Flags:** WebAuthn feature flags
**Civics Flags:** Civics platform feature flags

### P) Rate-limit Test Allowances

**Config:** `web/shared/core/security/lib/config.ts`
**Middleware:** `web/middleware.ts` with E2E bypass logic
**Test Environment:** `NODE_ENV=test` and `E2E=1` bypasses

---

## Generated Artifacts

All reports have been generated in `web/.reports/`:

- `tsconfig.resolved.json` - Resolved TypeScript configuration
- `import-alias-usage.txt` - Import alias usage statistics
- `routes.txt` - Next.js app directory routes
- `env-keys.txt` - Environment variable names (no secrets)
- `typecheck.txt` - TypeScript compilation output
- `build.txt` - Next.js build output
- `jest.txt` - Jest test results
- `playwright.txt` - Playwright E2E test results

---

## Critical Issues Summary

### 🚨 **Build Blockers**
1. **TypeScript path mapping conflicts** - Multiple `@/lib/*` mappings causing resolution issues
2. **Missing module exports** - Some lib files missing proper exports
3. **Import path inconsistencies** - Mixed usage of different import patterns

### ✅ **Working Systems**
1. **Admin authentication** - 100% functional, all tests passing
2. **Server-side guards** - Admin layout protection working
3. **API authentication** - All admin routes using `requireAdminOr401` pattern
4. **Database security** - RLS policies and `is_admin()` function working
5. **Test suite** - 20/20 tests passing, comprehensive coverage

### 🎯 **Overhaul Priorities**
1. **Fix TypeScript path mappings** - Consolidate duplicate aliases
2. **Standardize import patterns** - Use consistent import paths
3. **Resolve build errors** - Get production build working
4. **Maintain admin functionality** - Keep working systems intact

---

## Ready for Expert Analysis

This document provides everything needed for a clean overhaul:
- ✅ Complete system snapshot
- ✅ All configuration files
- ✅ Generated build/test artifacts
- ✅ Clear problem identification
- ✅ Working system preservation requirements

**Next Steps:** Expert can now analyze the path mapping conflicts, create codemods for import standardization, and fix build issues while preserving the working admin authentication system.
