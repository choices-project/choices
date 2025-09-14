# Expert Support Pack Integration

**Created:** 2025-01-27  
**Status:** Ready for Implementation  
**Source:** Expert comprehensive support pack with tools, scripts, and enhancements

## Executive Summary

The expert has provided a comprehensive **"support pack"** with enhanced tools, scripts, and improvements that significantly expand our implementation capabilities. This document integrates all the expert's additional resources into our roadmap.

## 🛠️ Expert Support Pack Components

### **1. Enhanced Module Stubs**
- More robust implementations than basic stubs
- Better error handling and browser safety
- Ready for production use

### **2. Alias Verification System**
- Automated script to detect path conflicts
- Prevents future import issues
- Integrates with CI/CD

### **3. Automated Codemods**
- Safe, repeatable import normalization
- Variable name fixes
- Automated refactoring tools

### **4. ESLint Guard System**
- Prevents forbidden import patterns
- Enforces consistent import rules
- Catches regressions early

### **5. CI/CD Integration**
- Minimal CI workflow for web
- Documentation header enforcement
- Automated quality gates

### **6. Test Infrastructure Enhancement**
- Rate limit bypass for E2E tests
- Test user seeding scripts
- Clean test environment setup

### **7. Documentation Infrastructure**
- Automated header management
- ADR and feature templates
- Documentation hygiene tools

---

## 📋 Enhanced Implementation Plan

### **Phase 1: Critical Fixes + Expert Tools**

#### **Step 1.1: Create Enhanced Missing Module Stubs**

**`web/lib/ssr-safe.ts` (Enhanced)**
```typescript
/**
 * Temporary stub to unblock builds. Replace with real impl when ready.
 */
export const isBrowser = () => typeof window !== 'undefined';
export const safeBrowserAccess = {
  window: () => (isBrowser() ? window : undefined),
  document: () => (isBrowser() ? document : undefined),
  navigator: () => (isBrowser() ? navigator : undefined),
  localStorage: () => (isBrowser() ? localStorage : undefined),
  sessionStorage: () => (isBrowser() ? sessionStorage : undefined),
  location: () => (isBrowser() ? location : undefined),
};
export function browserOnly<T>(fn: () => T, fallback?: T): T | undefined {
  return isBrowser() ? (safeTry(fn, fallback) as any) : fallback;
}
const safeTry = <T>(fn: () => T, fallback?: T) => { try { return fn(); } catch { return fallback as T; } };
```

**`web/lib/feature-flags.ts` (Enhanced)**
```typescript
/**
 * Minimal no-op feature flag system to satisfy imports.
 * Swap with a real provider later.
 */
type Flag = string;
const store = new Map<Flag, boolean>();
export const featureFlagManager = {
  enable: (k: Flag) => store.set(k, true),
  disable: (k: Flag) => store.set(k, false),
  toggle: (k: Flag) => store.set(k, !store.get(k)),
  get: (k: Flag) => store.get(k) ?? false,
  all: () => Object.fromEntries(store.entries()),
};
export const enableFeature = (k: Flag) => featureFlagManager.enable(k);
export const disableFeature = (k: Flag) => featureFlagManager.disable(k);
export const toggleFeature = (k: Flag) => featureFlagManager.toggle(k);
export const getFeatureFlag = (k: Flag) => featureFlagManager.get(k);
export const getAllFeatureFlags = () => featureFlagManager.all();
```

**`web/lib/supabase-ssr-safe.ts` (Enhanced)**
```typescript
/**
 * Thin convenience wrapper; safe to import on server & client.
 */
import { createBrowserClient, createServerClient } from '@supabase/ssr';

export function createBrowserClientSafe(url?: string, anonKey?: string) {
  const u = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const k = anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(u, k);
}

export function createServerClientSafe(url?: string, serviceKey?: string, cookiesApi?: any) {
  const u = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const k = serviceKey ?? process.env.SUPABASE_SECRET_KEY!;
  return createServerClient(u, k, cookiesApi);
}
```

**`web/utils/supabase/server.ts` (Enhanced)**
```typescript
/**
 * Minimal server client. Replace with your stricter version if present.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs: any[]) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}
```

#### **Step 1.2: Fix TypeScript Path Aliases (Enhanced)**

**Replace entire paths section in `web/tsconfig.json`:**
```json
"paths": {
  "@/*": ["./*"],
  "@/lib/*": ["./lib/*"],
  "@/utils/supabase/server": ["./utils/supabase/server"],
  "@/lib/supabase/server": ["./utils/supabase/server"]
}
```

#### **Step 1.3: Add Alias Sanity Check Script**

**Create:** `web/scripts/verify-aliases.mjs`
```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const tsconfigPath = process.argv[2] || path.resolve('web/tsconfig.json');
if (!fs.existsSync(tsconfigPath)) {
  console.error(`❌ tsconfig not found at ${tsconfigPath}`);
  process.exit(1);
}
const ts = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
const paths = ts?.compilerOptions?.paths || {};
let failed = false;

function dedupe(arr = []) {
  return [...new Set(arr)];
}
function looksConflicting(key, targets) {
  const uniq = dedupe(targets.map(t => t.replace(/\/\*$/, '')));
  return uniq.length > 1;
}

for (const [alias, targets] of Object.entries(paths)) {
  if (Array.isArray(targets) && looksConflicting(alias, targets)) {
    console.error(`❌ Alias "${alias}" maps to multiple roots: ${targets.join(', ')}`);
    failed = true;
  }
}

const forbidden = [/^@\/shared\/utils\/lib\//];
const warnImports = [];
function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
      scanDir(p);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const src = fs.readFileSync(p, 'utf8');
      for (const re of forbidden) {
        if (re.test(src)) warnImports.push(p);
      }
    }
  }
}
scanDir(path.resolve('web'));

if (warnImports.length) {
  console.warn(`⚠️  Forbidden import pattern found in:\n${warnImports.map(p => ` - ${p}`).join('\n')}`);
  failed = true;
}

if (failed) {
  console.error('🔒 Alias verification failed. Fix tsconfig paths or run the codemod to normalize imports.');
  process.exit(1);
}
console.log('✅ Alias verification passed.');
```

#### **Step 1.4: Fix Admin Route Bug with Codemod**

**Create:** `web/scripts/codemods/rename-supabase-var.mjs`
```javascript
/**
 * Fixes `let query = supabaseClient` -> `let query = supabase`
 * and renames identifier usages in the file.
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let renamed = false;
  root.find(j.Identifier, { name: 'supabaseClient' }).forEach(p => {
    p.value.name = 'supabase';
    renamed = true;
  });

  if (!renamed) return file.source;
  return root.toSource();
}
```

**Apply the fix:**
```bash
npx jscodeshift -t web/scripts/codemods/rename-supabase-var.mjs web/app/api/admin/feedback/route.ts
```

#### **Step 1.5: Verify Build Success (Enhanced)**
```bash
cd web
node scripts/verify-aliases.mjs
npm run type-check:strict
npm run build
```

---

### **Phase 2: Import Normalization + Expert Tools**

#### **Step 2.1: Create Import Codemod**

**Create:** `web/scripts/codemods/normalize-aliases.mjs`
```javascript
/**
 * Rewrites "@/shared/utils/lib/<x>" -> "@/lib/<x>"
 * Usage: npx jscodeshift -t web/scripts/codemods/normalize-aliases.mjs web
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const fix = (p) => p.replace(/^@\/shared\/utils\/lib\//, '@/lib/');
  root
    .find(j.ImportDeclaration)
    .filter(p => /^@\/shared\/utils\/lib\//.test(p.value.source.value))
    .forEach(p => { p.value.source.value = fix(p.value.source.value); });
  root
    .find(j.ExportAllDeclaration)
    .filter(p => /^@\/shared\/utils\/lib\//.test(p.value.source.value))
    .forEach(p => { p.value.source.value = fix(p.value.source.value); });
  root
    .find(j.ExportNamedDeclaration)
    .filter(p => p.value.source && /^@\/shared\/utils\/lib\//.test(p.value.source.value))
    .forEach(p => { p.value.source.value = fix(p.value.source.value); });
  return root.toSource();
}
```

#### **Step 2.2: Add ESLint Alias Guard**

**Create:** `web/eslint/.eslintrc.alias-guard.cjs`
```javascript
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/shared/utils/lib/*'], message: 'Use "@/lib/*" re-exports instead of importing from shared/utils directly.' }
      ]
    }],
  }
}
```

**Add to main ESLint config:**
```javascript
extends: ['./eslint/.eslintrc.alias-guard.cjs']
```

#### **Step 2.3: Run Enhanced Codemod**
```bash
# Verify aliases first
node scripts/verify-aliases.mjs

# Run normalization codemod
npx jscodeshift -t web/scripts/codemods/normalize-aliases.mjs web

# Verify no regressions
node scripts/verify-aliases.mjs
npm run type-check:strict
npm run build
npm test
```

---

### **Phase 3: CI/CD Integration**

#### **Step 3.1: Add Minimal CI Workflow**

**Create:** `.github/workflows/web-ci-min.yml`
```yaml
name: web:ci:min
on:
  pull_request:
    paths: [ "web/**", ".github/workflows/web-ci-min.yml" ]
  push:
    branches: [ main ]
    paths: [ "web/**", ".github/workflows/web-ci-min.yml" ]
jobs:
  build-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: 'web/package-lock.json'
      - run: npm ci --ignore-scripts
      - run: node scripts/verify-aliases.mjs
      - run: npm run type-check:strict
      - run: npm run build
      - run: npm run test:unit || npm test
```

#### **Step 3.2: Add Docs Headers Workflow**

**Create:** `.github/workflows/docs-headers.yml`
```yaml
name: docs:headers
on:
  pull_request:
    paths: [ "web/docs/**.md" ]
jobs:
  check-doc-headers:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node tools/docs/add-doc-header.mjs --check "docs/**/*.md"
```

---

### **Phase 4: Test Infrastructure Enhancement**

#### **Step 4.1: Add Rate Limit Test Toggle**

**Merge into:** `web/middleware.ts`
```typescript
// Skip rate limiting & auth throttle in E2E or TEST mode
const isE2E = process.env.E2E === '1' || process.env.PLAYWRIGHT === '1';
if (isE2E) {
  // example: bypass throttling for login & auth endpoints
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next(); // allow freely
  }
}
```

#### **Step 4.2: Add Test User Seeding**

**Create:** `web/scripts/test/seed-supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  async function ensureUser(email: string, password: string, isAdmin: boolean) {
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { is_admin: isAdmin }
    });
    if (error && !/already registered/i.test(error.message)) console.error('Create user error:', email, error);
    const userId = data?.user?.id;
    if (userId) {
      await admin.from('user_profiles').upsert({ user_id: userId, email, is_admin: isAdmin, is_active: true }, { onConflict: 'user_id' });
    }
  }

  console.log('🌱 Seeding users...');
  await ensureUser('admin@example.com', 'Passw0rd!123', true);
  await ensureUser('user@example.com', 'Passw0rd!123', false);
  console.log('✅ Done');
}

main().catch(e => { console.error(e); process.exit(1); });
```

**Create:** `web/scripts/test/cleanup-supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const emails = ['admin@example.com', 'user@example.com'];
  for (const email of emails) {
    const { data, error } = await admin.auth.admin.listUsers({ email });
    if (error) { console.error(error); continue; }
    for (const u of data.users) {
      await admin.from('user_profiles').delete().eq('user_id', u.id);
      await admin.auth.admin.deleteUser(u.id);
      console.log(`🗑️ deleted ${email} (${u.id})`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
```

---

### **Phase 5: Documentation Infrastructure**

#### **Step 5.1: Add Documentation Tools**

**Create:** `web/tools/docs/add-doc-header.mjs`
```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import glob from 'node:glob';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const write = args.includes('--write') || !checkOnly;
const patterns = args.filter(a => !a.startsWith('--'));
const files = patterns.length ? patterns.flatMap(p => glob.sync(p)) : [];

let failed = false;

for (const f of files) {
  const p = path.resolve(f);
  let s = fs.readFileSync(p, 'utf8');
  const hasCreated = /^(\s*#.*\n)?\s*\*\*Created:\*\*/mi.test(s);
  const hasUpdated = /^(\s*#.*\n)?\s*\*\*Updated:\*\*/mi.test(s);
  if (hasCreated && hasUpdated) continue;

  if (checkOnly) {
    console.error(`❌ Missing Created/Updated header: ${f}`);
    failed = true;
    continue;
  }
  const today = new Date().toISOString().slice(0,10);
  const header = `**Created:** ${today}  \n**Updated:** ${today}\n\n`;
  // Try to insert after first H1 if present
  if (/^# .*/m.test(s)) {
    s = s.replace(/^# .*\n?/, (m) => `${m}${header}`);
  } else {
    s = `${header}${s}`;
  }
  fs.writeFileSync(p, s, 'utf8');
  console.log(`📝 Stamped header: ${f}`);
}
if (checkOnly && failed) process.exit(1);
```

#### **Step 5.2: Add Documentation Templates**

**Create:** `web/docs/templates/ADR.md`
```markdown
# ADR-XXXX: Title

**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Superseded

## Context
What problem are we solving?

## Decision
What did we decide? (bullets)

## Consequences
Trade-offs, risks, follow-ups.

## References
Links, issues, PRs.
```

**Create:** `web/docs/templates/Feature-Record.md`
```markdown
# Feature: <Name>

**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD  
**Status:** Draft | In Progress | Done

## Summary
One-paragraph description and goal.

## Scope / Files Touched
- app/...  
- lib/...  
- api/...

## Notes for Future Maintainers
Caveats, flags, operational notes.

## Follow-ups
- [ ] item
```

---

## 🎯 Expert Checklist

The expert provided this quick checklist:

1. ✅ **Replace @/lib/* path mapping** so it points to one root only
2. ✅ **Run alias verifier** - Fix any forbidden imports with the codemod
3. ✅ **Drop stubs** if the three modules are missing (remove later once real code lands)
4. ✅ **Fix supabaseClient → supabase** in feedback route (codemod above)
5. ✅ **Add ESLint alias guard** to prevent regressions
6. ✅ **Add CI workflows** - protect branch with web:ci:min if desired
7. ✅ **Merge rate-limit bypass snippet** into middleware.ts gated by E2E=1
8. ✅ **Seed Supabase test users**

---

## 🚀 Implementation Order

1. **Create enhanced missing module stubs** (Step 1.1)
2. **Fix TypeScript path aliases** (Step 1.2)
3. **Add alias sanity check script** (Step 1.3)
4. **Fix admin route bug with codemod** (Step 1.4)
5. **Verify build success** (Step 1.5)
6. **Run enhanced import normalization** (Step 2.1-2.3)
7. **Add CI/CD workflows** (Step 3.1-3.2)
8. **Enhance test infrastructure** (Step 4.1-4.2)
9. **Add documentation tools** (Step 5.1-5.2)

---

## 📊 Enhanced Success Criteria

### **Phase 1 Success:**
- ✅ `node scripts/verify-aliases.mjs` passes
- ✅ `npm run type-check:strict` passes
- ✅ `npm run build` succeeds
- ✅ All admin routes compile without errors
- ✅ No missing module errors

### **Phase 2 Success:**
- ✅ Consistent import patterns across codebase
- ✅ No `@/shared/utils/lib/*` imports in admin code
- ✅ ESLint alias guard prevents regressions
- ✅ All tests still pass
- ✅ Build remains successful

### **Phase 3 Success:**
- ✅ CI workflow runs successfully
- ✅ Alias verification integrated into CI
- ✅ Documentation headers enforced

### **Phase 4 Success:**
- ✅ E2E tests run without rate limit issues
- ✅ Test users seeded successfully
- ✅ Clean test environment setup

### **Overall Success:**
- ✅ Production-ready build
- ✅ Admin system fully functional
- ✅ Clean, maintainable codebase
- ✅ No TypeScript errors
- ✅ Automated quality gates
- ✅ Comprehensive test infrastructure

---

## 🏗️ **NEW: Automated Directory Reorganization System**

The expert has provided a **comprehensive automated reorganization system** that consolidates our scattered directory structure into a clean, logical layout.

### **📋 Reorganization Plan (Ready-to-Run)**

**Create:** `web/scripts/reorg/plan.json`
```json
{
  "moves": [
    { "from": "web/admin/lib", "to": "web/lib/admin" },

    { "from": "web/shared/utils/lib", "to": "web/lib/shared/utils" },
    { "from": "web/shared/lib", "to": "web/lib/shared/legacy" },

    { "from": "web/shared/core/database/lib", "to": "web/lib/core/database" },
    { "from": "web/shared/core/privacy/lib", "to": "web/lib/core/privacy" },
    { "from": "web/shared/core/security/lib", "to": "web/lib/core/security" },
    { "from": "web/shared/core/performance/lib", "to": "web/lib/core/performance" },
    { "from": "web/shared/core/services/lib", "to": "web/lib/core/services" },

    { "from": "web/shared/modules/lib", "to": "web/lib/modules" },

    { "from": "web/shared/utils/types/guards", "to": "web/lib/types/guards" },

    // Optional consolidations (safe to leave in; will be skipped if source is absent)
    { "from": "web/features/webauthn/lib", "to": "web/lib/webauthn" },
    { "from": "web/features/pwa/lib", "to": "web/lib/pwa" },
    { "from": "web/features/analytics/lib", "to": "web/lib/analytics" },
    { "from": "web/features/auth/lib", "to": "web/lib/auth" }
  ],

  "aliasRewrites": [
    // shared → lib
    { "from": "^@/shared/utils/lib/(.*)$", "to": "@/lib/shared/utils/$1" },
    { "from": "^@/shared/lib/(.*)$", "to": "@/lib/shared/legacy/$1" },

    { "from": "^@/shared/core/database/lib/(.*)$", "to": "@/lib/core/database/$1" },
    { "from": "^@/shared/core/privacy/lib/(.*)$", "to": "@/lib/core/privacy/$1" },
    { "from": "^@/shared/core/security/lib/(.*)$", "to": "@/lib/core/security/$1" },
    { "from": "^@/shared/core/performance/lib/(.*)$", "to": "@/lib/core/performance/$1" },
    { "from": "^@/shared/core/services/lib/(.*)$", "to": "@/lib/core/services/$1" },

    { "from": "^@/shared/modules/lib/(.*)$", "to": "@/lib/modules/$1" },
    { "from": "^@/shared/utils/types/guards$", "to": "@/lib/types/guards" },

    // admin library
    { "from": "^@/admin/lib/(.*)$", "to": "@/lib/admin/$1" },

    // feature libs (if you opted into the moves above)
    { "from": "^@/features/webauthn/lib/(.*)$", "to": "@/lib/webauthn/$1" },
    { "from": "^@/features/pwa/lib/(.*)$", "to": "@/lib/pwa/$1" },
    { "from": "^@/features/analytics/lib/(.*)$", "to": "@/lib/analytics/$1" },
    { "from": "^@/features/auth/lib/(.*)$", "to": "@/lib/auth/$1" },

    // previously special-cased aliases that now live under lib/*
    { "from": "^@/lib/real-time-news-service$", "to": "@/lib/core/services/real-time-news-service" },
    { "from": "^@/lib/security/config$", "to": "@/lib/core/security/config" },
    { "from": "^@/lib/feedback-tracker$", "to": "@/lib/admin/feedback-tracker" },

    // clean up the "supabase-ssr-safe" confusion to a single ssr-safe module
    { "from": "^@/lib/supabase-ssr-safe$", "to": "@/lib/ssr-safe" }
  ]
}
```

**Create:** `web/scripts/reorg/run-reorg.mjs`
```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve('web');
const PLAN = path.join(ROOT, 'scripts/reorg/plan.json');
const DRY = process.argv.includes('--dry');

function sh(cmd, opts = {}) {
  const [c, ...args] = cmd.split(' ');
  const res = spawnSync(c, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

function shOut(cmd, cwd = '.') {
  const [c, ...args] = cmd.split(' ');
  const res = spawnSync(c, args, { cwd, encoding: 'utf8' });
  if (res.status !== 0) process.exit(res.status ?? 1);
  return res.stdout.trim();
}

function assertCleanGit() {
  const s = shOut('git status --porcelain');
  if (s) {
    console.error('🛑 Working tree not clean. Commit or stash before running reorg.');
    process.exit(1);
  }
}

function loadPlan() {
  if (!fs.existsSync(PLAN)) {
    console.error(`🛑 Plan file not found: ${PLAN}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(PLAN, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function gitMv(from, to) {
  if (!fs.existsSync(from)) {
    console.warn(`⚠️  source missing, skipping: ${from}`);
    return;
  }
  ensureDir(path.dirname(to));
  if (DRY) {
    console.log(`DRY: git mv ${from} ${to}`);
    return;
  }
  sh(`git mv ${from} ${to}`);
}

function rewriteImports(rules) {
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
  const isCode = (f) => exts.some((e) => f.endsWith(e));
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.next', 'dist', '.turbo'].includes(entry.name)) continue;
        walk(p);
      } else if (isCode(p)) {
        let s = fs.readFileSync(p, 'utf8');
        let changed = false;
        for (const r of rules) {
          const re = new RegExp(r.from, 'g');
          if (re.test(s)) {
            s = s.replace(re, r.to);
            changed = true;
          }
        }
        if (changed && !DRY) fs.writeFileSync(p, s, 'utf8');
        if (changed && DRY) console.log(`DRY: rewrite ${p}`);
      }
    }
  };
  walk(ROOT);
}

function patchTsconfig() {
  const tsPath = path.join(ROOT, 'tsconfig.json');
  const ts = JSON.parse(fs.readFileSync(tsPath, 'utf8'));
  ts.compilerOptions = ts.compilerOptions || {};
  ts.compilerOptions.baseUrl = '.';
  ts.compilerOptions.paths = ts.compilerOptions.paths || {};
  // enforce single-root lib mapping
  ts.compilerOptions.paths['@/lib/*'] = ['./lib/*'];
  // keep your supabase mappings intact
  ts.compilerOptions.paths['@/utils/supabase/server'] = ['./utils/supabase/server'];
  ts.compilerOptions.paths['@/lib/supabase/server'] = ['./utils/supabase/server'];
  if (!DRY) fs.writeFileSync(tsPath, JSON.stringify(ts, null, 2));
  console.log(DRY ? 'DRY: would patch tsconfig paths' : '✅ tsconfig paths patched');
}

function main() {
  assertCleanGit();
  const plan = loadPlan();

  const branch = `reorg/${new Date().toISOString().slice(0,10)}`;
  if (!DRY) sh(`git checkout -b ${branch}`);
  else console.log(`DRY: would create branch ${branch}`);

  for (const mv of plan.moves || []) {
    gitMv(path.resolve(mv.from), path.resolve(mv.to));
  }

  patchTsconfig();
  rewriteImports(plan.aliasRewrites || []);

  console.log('\n🔎 Next steps:');
  console.log('  1) node web/scripts/verify-aliases.mjs');
  console.log('  2) (cd web) npm run type-check:strict');
  console.log('  3) (cd web) npm run build');
  console.log('  4) run tests: npm run test:unit && npm run test:e2e');
  console.log('  5) push PR, review diff. If happy: merge & delete branch.');
}

main();
```

### **🚀 Reorganization Execution Commands**

```bash
# From repo root
node web/scripts/reorg/run-reorg.mjs --dry   # preview changes
node web/scripts/reorg/run-reorg.mjs         # execute reorganization
node web/scripts/verify-aliases.mjs          # verify aliases
(cd web && npm run type-check:strict && npm run build && npm run test:unit)
```

### **📁 Final Directory Structure**

After reorganization:
```
web/
├── lib/
│   ├── admin/                    # From web/admin/lib
│   ├── shared/
│   │   ├── utils/               # From web/shared/utils/lib
│   │   └── legacy/              # From web/shared/lib
│   ├── core/
│   │   ├── database/            # From web/shared/core/database/lib
│   │   ├── privacy/             # From web/shared/core/privacy/lib
│   │   ├── security/            # From web/shared/core/security/lib
│   │   ├── performance/         # From web/shared/core/performance/lib
│   │   └── services/            # From web/shared/core/services/lib
│   ├── modules/                 # From web/shared/modules/lib
│   ├── types/
│   │   └── guards/              # From web/shared/utils/types/guards
│   ├── webauthn/                # From web/features/webauthn/lib (optional)
│   ├── pwa/                     # From web/features/pwa/lib (optional)
│   ├── analytics/               # From web/features/analytics/lib (optional)
│   └── auth/                    # From web/features/auth/lib (optional)
├── utils/
│   └── supabase/
│       └── server.ts            # Stays in place
└── [rest of structure unchanged]
```

### **⚙️ Final TypeScript Configuration**

After reorganization, `web/tsconfig.json` will have:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/utils/supabase/server": ["./utils/supabase/server"],
      "@/lib/supabase/server": ["./utils/supabase/server"]
    }
  }
}
```

---

## 🎯 **FINAL IMPLEMENTATION STRATEGY**

### **Option A: Conservative (Quick Fix)**
1. Create missing module stubs
2. Fix TypeScript path aliases
3. Get builds working immediately
4. **Skip reorganization for now**

### **Option B: Complete Overhaul (Recommended)**
1. **Run automated reorganization** (creates safety branch)
2. Create missing module stubs in new structure
3. Verify builds work with clean structure
4. **Get both working builds AND clean architecture**

### **🎯 Expert Recommendation: Option B**

The expert's reorganization system is:
- ✅ **Safe** (creates safety branch, uses `git mv`)
- ✅ **Comprehensive** (handles all imports and aliases)
- ✅ **Audit-friendly** (preserves git history)
- ✅ **Future-proof** (clean, logical structure)

---

## 📋 **FINAL CHECKLIST**

### **Before Starting:**
- [ ] Commit current changes
- [ ] Install `jscodeshift` (when confirmed)
- [ ] Create missing directories for scripts

### **Implementation Steps:**
1. [ ] **Create reorganization files** (`plan.json`, `run-reorg.mjs`)
2. [ ] **Preview reorganization** (`--dry` mode)
3. [ ] **Execute reorganization** (creates safety branch)
4. [ ] **Create missing module stubs** in new structure
5. [ ] **Verify builds work** (`type-check`, `build`, `test`)
6. [ ] **Add CI/CD workflows** and verification scripts
7. [ ] **Test E2E infrastructure** with rate limit bypass

### **Success Criteria:**
- ✅ Clean, logical directory structure
- ✅ Working TypeScript builds
- ✅ All admin functionality preserved
- ✅ Automated quality gates
- ✅ Comprehensive test infrastructure

---

---

## 🚀 **EXPERT REFINEMENTS: High-Leverage Improvements**

The expert has provided **critical refinements** to make our overhaul smooth, reversible, and future-proof.

### **1. Lock One Public "lib API" and Enforce It**

**Minimal Alias Set:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/utils/supabase/server": ["./utils/supabase/server"],
      "@/lib/supabase/server": ["./utils/supabase/server"]
    }
  }
}
```

**Create Barrel Exports:**
- `web/lib/index.ts` - Re-exports public primitives
- `web/lib/core/index.ts` - Core API surface
- `web/lib/admin/index.ts` - Admin-only exports
- `web/lib/shared/utils/index.ts` - Utilities for app/components

### **2. Guard Architecture with ESLint Boundaries**

**Create:** `web/eslint/.eslintrc.layers.cjs`
```javascript
module.exports = {
  plugins: ['boundaries', 'import'],
  settings: {
    'boundaries/elements': [
      { type: 'app', pattern: 'app/**' },
      { type: 'components', pattern: 'components/**' },
      { type: 'lib-core', pattern: 'lib/core/**' },
      { type: 'lib-admin', pattern: 'lib/admin/**' },
      { type: 'lib-shared', pattern: 'lib/shared/**' },
      { type: 'utils', pattern: 'utils/**' },
      { type: 'tests', pattern: 'tests/**' }
    ]
  },
  rules: {
    // No imports from app/** outside app
    'boundaries/no-private': ['error', [{ from: ['components', 'lib-*', 'utils', 'tests'], allow: ['app/**'] }]],
    // Components/lib can't import from app
    'no-restricted-imports': ['error', [{ patterns: ['@/app/*'] }]],
    // Only import via @/lib/* (no deep shared paths)
    'no-restricted-imports': ['error', {
      patterns: [
        { group: ['@/shared/**', '@/features/**'], message: 'Import via "@/lib/*" after reorg.' }
      ]
    }]
  }
}
```

**Update main ESLint config:**
```javascript
extends: ['./eslint/.eslintrc.alias-guard.cjs', './eslint/.eslintrc.layers.cjs']
```

### **3. Make Reorg Script Stricter and Safer**

**Enhanced Safety Features:**
- ✅ Abort if changed files exist (already implemented)
- ✅ Warn on ignored-but-present paths
- ✅ Dry-run summary with file/import counts
- ✅ Post-rewrite scanner for remaining `@/shared/**` imports

### **4. Update Jest + ESLint Resolvers Post-Move**

**Enhanced Jest Config:**
```javascript
// web/jest.server.config.js (and client)
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/supabase/server$': '<rootDir>/utils/supabase/server'
  }
}
```

**Enhanced ESLint Resolver:**
```javascript
// web/.eslintrc.cjs
settings: {
  'import/resolver': {
    typescript: { project: './tsconfig.json' },
    node: { extensions: ['.js','.jsx','.ts','.tsx'] }
  }
}
```

### **5. Strengthen TypeScript for Long-Term Stability**

**Enhanced tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "moduleDetection": "force",
    "verbatimModuleSyntax": true
  }
}
```

### **6. Stubs: Add Production Safeguards**

**Enhanced Stubs with Production Warnings:**
```typescript
// web/lib/ssr-safe.ts
if (process.env.NODE_ENV === 'production') {
  console.warn('[ssr-safe] Using temporary stub in production. Replace with real impl.');
}
```

### **7. Finish "supabaseClient → supabase" Codemod**

**Enhanced Safety:**
- ✅ Skip files that already declare `const supabaseClient = ...`
- ✅ Add CI grep: `git grep -n "supabaseClient[\\.\\[]"`
- ✅ Fail fast on future regressions

### **8. Docs Discipline with ADRs + Feature Records**

**Create:** `.github/pull_request_template.md`
```markdown
### Summary
- 

### Checklist
- [ ] Updated or created Feature Record (if applicable)
- [ ] ADR updated/added (if architecture decision)
- [ ] Docs header stamped (Created/Updated)
```

**Documentation Structure:**
- `docs/ADR-INDEX.md` - Incremental ADR tracking
- `docs/features/` - Active feature records
- Archive feature records when features stabilize

### **9. Git Hygiene for Temp Docs/Scripts**

**Add to .gitignore:**
```
web/docs/_scratch/**
web/scripts/_scratch/**
```

**Create scratch directories:**
- `web/docs/_scratch/` - Temporary documentation
- `web/scripts/_scratch/` - Temporary scripts

### **10. Branch Protection Tune-Up**

**Required Status Checks:**
- `web:ci:min` (or main `web:ci`)
- `gitleaks`
- `CodeQL`

**Settings:**
- ✅ Require branches up to date
- ✅ Optional: merge queue for high PR volume

---

## 🎯 **REFINED IMPLEMENTATION ORDER (Option B)**

### **Phase 1: Pre-Reorg Setup**
1. **Commit/stash everything**
2. **Drop enhanced stubs** (ssr-safe, feature-flags, supabase-ssr-safe)
3. **Patch tsconfig paths** to minimal set
4. **Run alias verification** - fix any red lines

### **Phase 2: Automated Reorganization**
1. **Dry run reorg:** `node web/scripts/reorg/run-reorg.mjs --dry`
2. **Execute reorg:** `node web/scripts/reorg/run-reorg.mjs`
3. **Run codemods** (normalize aliases + supabase var rename)
4. **Verify aliases again:** `node web/scripts/verify-aliases.mjs`

### **Phase 3: Post-Reorg Verification**
1. **Type check:** `npm run type-check:strict`
2. **Lint:** `npm run lint:strict`
3. **Build:** `npm run build`
4. **Tests:** `npm run test:unit`
5. **Push PR** - branch protection enforces guardrails

### **Phase 4: Enhanced Infrastructure**
1. **Add ESLint boundaries** (layers, import guards)
2. **Update Jest/ESLint resolvers**
3. **Strengthen TypeScript config**
4. **Add production safeguards to stubs**
5. **Set up documentation discipline**

### **Phase 5: CI/CD Enhancement**
1. **Add branch protection rules**
2. **Set up PR template**
3. **Configure coverage thresholds**
4. **Add E2E rate-limit bypass**

---

## 📋 **ENHANCED SUCCESS CRITERIA**

### **Immediate Success:**
- ✅ Clean, logical directory structure
- ✅ Working TypeScript builds
- ✅ All admin functionality preserved
- ✅ No `@/shared/**` or `@/features/**` imports

### **Long-term Success:**
- ✅ Enforced architectural boundaries
- ✅ Production-safe stub warnings
- ✅ Comprehensive CI/CD guardrails
- ✅ Documentation discipline
- ✅ Future-proof, maintainable codebase

---

## 🔧 **NICE-TO-HAVES (Do Whenever)**

1. **Renovate/Dependabot** - Weekly dependency updates
2. **VS Code settings** - Format on save, ESLint auto-fix
3. **Smoke page** - `/admin/_health` for cheap E2E probe
4. **Coverage thresholds** - Lines 80%, branches 70%

---

## ❓ **FINAL QUESTIONS**

1. **Ready to proceed with refined Option B?**
2. **Any feature folders to exclude** from reorganization?
3. **Should we start with Phase 1** (pre-reorg setup)?

---

**Status:** Ready for refined implementation with expert's high-leverage improvements  
**Expert Available:** Yes - comprehensive refinements provided  
**Recommended Approach:** Refined Option B with architectural boundaries and production safeguards  
**Estimated Time:** 4-6 hours for complete refined implementation
