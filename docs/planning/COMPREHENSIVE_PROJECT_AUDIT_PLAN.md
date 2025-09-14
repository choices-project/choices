# Comprehensive Project Audit & Cleanup Plan

**Created:** December 19, 2024  
**Status:** 🚀 In Progress - Let's get that perfect build!

## 🎯 Mission Statement

Perform a comprehensive audit and cleanup of the entire codebase to:
1. **Eliminate all outdated patterns** (ia_*/po_* tables, direct browser globals)
2. **Enforce new defense-in-depth guidelines** everywhere
3. **Remove unused/obsolete files** 
4. **Update documentation** to reflect current state
5. **Achieve perfect build** with zero issues

---

## 📋 Phase 1: Discovery & Analysis

### 1.1 Table Name Audit
**Goal:** Find all references to scrapped `ia_*` and `po_*` tables

```bash
# Search for old table patterns
grep -r "ia_users\|ia_\|po_polls\|po_votes\|po_" web/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

**Expected Findings:**
- API routes using old table names
- Type definitions referencing old schema
- Mock data with old table structures
- Documentation with outdated examples

### 1.2 Browser Globals Audit
**Goal:** Find all direct browser global usage

```bash
# Search for direct browser global usage
grep -r "\bwindow\b\|\bdocument\b\|\bnavigator\b\|\blocalStorage\b\|\bsessionStorage\b" web/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next
```

**Expected Findings:**
- Components using direct `window.location`
- Utilities accessing `navigator.userAgent`
- Storage operations without SSR guards
- Event listeners without proper boundaries

### 1.3 Supabase Import Audit
**Goal:** Find all Supabase imports and ensure proper separation

```bash
# Search for Supabase imports
grep -r "@supabase\|createServerClient\|createBrowserClient" web/ --include="*.ts" --include="*.tsx"
```

**Expected Findings:**
- Direct imports of `@supabase/supabase-js` in components
- Mixed server/client Supabase usage
- Missing boundary enforcement

### 1.4 Unused Files Audit
**Goal:** Identify obsolete files and patterns

```bash
# Find disabled files
find web/ -name "*.disabled" -type f
find web/ -name "*.disabled" -type d

# Find archive directories
find web/ -name "archive" -type d
find web/ -name "disabled-*" -type d
```

---

## 📋 Phase 2: Systematic Cleanup

### 2.1 Table Name Migration
**Priority:** 🔴 Critical

**Tasks:**
- [ ] Update all API routes to use correct table names
- [ ] Fix type definitions and interfaces
- [ ] Update mock data structures
- [ ] Fix database queries and operations

**Correct Mappings:**
```typescript
// OLD → NEW
ia_users → user_profiles
po_polls → polls  
po_votes → votes
ia_* → user_profiles (with appropriate field mapping)
po_* → polls/votes (with appropriate field mapping)
```

### 2.2 Browser Globals Migration
**Priority:** 🔴 Critical

**Tasks:**
- [ ] Replace direct `window` access with `safeWindow()`
- [ ] Replace direct `document` access with `safeDocument()`
- [ ] Replace direct `navigator` access with `safeNavigator()`
- [ ] Replace direct storage access with `safeLocalStorage`/`safeSessionStorage`
- [ ] Add proper client/server boundaries

**Pattern:**
```typescript
// OLD
window.location.href = '/polls'
document.querySelector('.element')
navigator.userAgent
localStorage.getItem('key')

// NEW
safeNavigate('/polls')
safeDocument(d => d.querySelector('.element'))
getUserAgent()
safeLocalStorage.get('key')
```

### 2.3 Supabase Import Cleanup
**Priority:** 🟡 High

**Tasks:**
- [ ] Replace direct `@supabase/supabase-js` imports with wrapper functions
- [ ] Add `import 'server-only'` to server-side files
- [ ] Add `'use client'` to client components using Supabase
- [ ] Ensure proper client/server separation

**Pattern:**
```typescript
// OLD
import { createClient } from '@supabase/supabase-js'

// NEW (Server)
import { createSupabaseServerClient } from '@/lib/supabase/server'

// NEW (Client)  
import { createSupabaseClient } from '@/lib/supabase/client'
```

### 2.4 File Cleanup
**Priority:** 🟡 Medium

**Tasks:**
- [ ] Remove `.disabled` files that are truly obsolete
- [ ] Archive or remove `archive/` directories
- [ ] Clean up `disabled-*` directories
- [ ] Remove unused imports and exports
- [ ] Consolidate duplicate utilities

---

## 📋 Phase 3: Validation & Testing

### 3.1 Build Validation
**Priority:** 🔴 Critical

**Tasks:**
- [ ] Run `npm run type-check:server` - should pass
- [ ] Run `npm run build` - should complete successfully
- [ ] Run build scanner - should show zero browser globals
- [ ] Run ESLint - should show no server-side browser global violations

### 3.2 Runtime Testing
**Priority:** 🟡 High

**Tasks:**
- [ ] Test API routes work with new table names
- [ ] Test client components work with new Supabase patterns
- [ ] Test SSR-safe utilities work correctly
- [ ] Test boundary enforcement works (server-only/client-only)

---

## 📋 Phase 4: File Structure Reorganization

### 4.1 Create New Directory Structure
**Priority:** 🟡 High

**Tasks:**
- [ ] Create `core/`, `features/`, `shared/`, `disabled/` directories
- [ ] Move core features to `core/` (auth, polls, users, api)
- [ ] Move experimental features to `features/` (webauthn, pwa, analytics)
- [ ] Move shared utilities to `shared/` (lib, components, types)
- [ ] Move disabled files to `disabled/`

### 4.2 Gracefully Disable WebAuthn
**Priority:** 🟡 High

**Tasks:**
- [ ] Create feature flag system
- [ ] Move WebAuthn files to `features/webauthn/`
- [ ] Update login page to use feature flags
- [ ] Add graceful fallbacks for disabled features
- [ ] Update all WebAuthn references

### 4.3 Update Import Paths
**Priority:** 🔴 Critical

**Tasks:**
- [ ] Update all import statements to new paths
- [ ] Update TypeScript path mappings in `tsconfig.json`
- [ ] Update Next.js path aliases
- [ ] Update build configuration
- [ ] Test all imports resolve correctly

### 4.4 Build Configuration Updates
**Priority:** 🔴 Critical

**Tasks:**
- [ ] Update `tsconfig.json` path mappings
- [ ] Update `next.config.js` if needed
- [ ] Update ESLint configuration paths
- [ ] Update any build scripts
- [ ] Verify build process works with new structure

### 4.5 Testing & Validation
**Priority:** 🔴 Critical

**Tasks:**
- [ ] Run all existing tests
- [ ] Update test imports if needed
- [ ] Test core functionality works
- [ ] Test disabled features fail gracefully
- [ ] Verify no broken imports

## 📋 Phase 5: Documentation Update

### 5.1 Code Documentation
**Priority:** 🟡 Medium

**Tasks:**
- [ ] Update API documentation with correct table names
- [ ] Update component documentation with new patterns
- [ ] Update utility documentation with SSR-safe usage
- [ ] Add examples of proper client/server separation
- [ ] Document new file structure

### 5.2 Architecture Documentation
**Priority:** 🟡 Medium

**Tasks:**
- [ ] Update system architecture diagrams
- [ ] Document defense-in-depth system
- [ ] Create developer guidelines for SSR-safe code
- [ ] Update deployment and CI documentation
- [ ] Document feature flag system

---

## 🛠️ Execution Strategy

### Step 1: Discovery (30 minutes)
Run all audit commands and create comprehensive lists of issues

### Step 2: Critical Fixes (2-3 hours)
Focus on table names and browser globals - these are blocking issues

### Step 3: File Structure Reorganization (2-3 hours)
- Create new directory structure
- Move files to appropriate locations
- **CRITICAL**: Update all import paths immediately
- **CRITICAL**: Update build configuration (tsconfig.json, next.config.js)
- **CRITICAL**: Test imports resolve correctly

### Step 4: Graceful Feature Disabling (1-2 hours)
- Implement feature flag system
- Disable WebAuthn gracefully
- Add fallbacks for disabled features
- Update all references

### Step 5: Testing & Validation (1 hour)
- **CRITICAL**: Run all tests
- **CRITICAL**: Verify build process works
- **CRITICAL**: Test core functionality
- **CRITICAL**: Verify no broken imports

### Step 6: Documentation (1 hour)
Update docs to reflect current state and new structure

---

## 🎯 Success Criteria

### ✅ Perfect Build
- Zero TypeScript errors
- Zero ESLint violations
- Zero browser globals in server bundles
- All tests passing

### ✅ Clean Codebase
- No references to old table names
- No direct browser global usage
- Proper client/server separation
- No unused/obsolete files

### ✅ Updated Documentation
- All docs reflect current architecture
- Clear guidelines for developers
- Examples use current patterns

---

## 🚀 Discovery Results - Let's Get Started!

**Current Status:** ✅ Phase 1 Complete - Discovery & Analysis

### 📊 **Audit Findings:**

#### 🔴 **Critical Issues Found:**
1. **74 references** to old table names (`ia_*`, `po_*`) across the codebase
2. **Multiple API routes** using outdated schema
3. **Legacy Supabase patterns** in `supabase-ssr-safe.ts`
4. **Browser globals** in `webauthn.ts` need SSR-safe updates

#### 🟡 **Medium Priority Issues:**
1. **10+ disabled files** that may be obsolete
2. **Archive directory** with old code
3. **Mixed Supabase import patterns**

#### 🟢 **Good News:**
1. **SSR-safe utilities** are working correctly
2. **Build scanner** shows zero browser globals in server bundles
3. **New Supabase separation** is properly implemented

### 🎯 **Next Action:** Begin Phase 2 - Systematic Cleanup

**Priority Order:**
1. **Table name migration** (74 references - Critical)
2. **Browser globals cleanup** (webauthn.ts - Critical)  
3. **Supabase import cleanup** (legacy patterns - High)
4. **File cleanup** (disabled/archive - Medium)

**Estimated Remaining Time:** 4-6 hours of focused work

**Goal:** Perfect build with zero issues! 🎯
