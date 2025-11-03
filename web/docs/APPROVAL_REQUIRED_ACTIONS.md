# Actions Requiring User Approval

**Date:** 2025-11-03  
**Purpose:** Comprehensive list of all actions for tie-off process

---

## ✅ ALREADY APPROVED & COMPLETED

- [x] ComprehensiveAdminDashboard message creation form - **IMPLEMENTED**
- [x] Research-first methodology - **DOCUMENTED**

---

## 🔴 CRITICAL DECISIONS NEEDED (Priority Order)

### 1. DEAD CODE vs PARTIAL FEATURES - Which to Remove vs Implement?

#### A. UnifiedFeed Helper Functions (Research Findings)

**File:** `features/feeds/components/UnifiedFeed.tsx`

| Function | Line | Used? | Recommendation | Effort if Implementing |
|----------|------|-------|----------------|----------------------|
| `sharingOptions` | 485 | ❌ Created but never passed to any function | **REMOVE** - Dead variable | - |
| `getContentTypeIcon` | 638 | ❌ Defined but never called | **IMPLEMENT** - Should show icons in feed? | 10 min (wire to FeedItem) |
| `getPartyColor` | 670 | ❌ Defined but never called | **IMPLEMENT** - Should color party badges? | 10 min (wire to FeedItem) |
| `formatDate` | 683 | ❌ Defined but never called | **IMPLEMENT** - Should format timestamps? | 10 min (wire to FeedItem) |
| `calculatePersonalizationScore` | 702 | ❌ Defined but never called | **IMPLEMENT** - Personalization feature? | 30 min (needs sorting logic) |
| `toggleItemExpansion` | 716 | ✅ USED (lines 717, 774) | **KEEP** - Already working | - |
| `loadImage` | 749 | ❌ Defined but never called | **IMPLEMENT** - Lazy loading images? | 15 min (wire to img tags) |

**My Analysis:**
- Functions exist because UnifiedFeed is meant to be comprehensive
- Component comment says it "replaces: SocialFeed, EnhancedSocialFeed"
- These functions likely copied from those components but not integrated yet

**DECISION NEEDED:**
- **Option A:** Implement all 6 functions (wire them into the UI) - ~1.5 hours
- **Option B:** Remove as dead code - 15 minutes
- **Option C:** Keep but document as "TODO features" - 10 minutes

**My Recommendation:** **Option A** - UnifiedFeed should be comprehensive, implement the features

---

#### B. HashtagTrending - Unused Filter Hook

**File:** `features/hashtags/components/HashtagTrending.tsx`

| Item | Line | Issue | Recommendation |
|------|------|-------|----------------|
| `useHashtagFilters` function | 41 | Function defined but never called | **REMOVE** - Dead code, violates hooks rules |
| `setSortBy`, `setTimeRange`, `setSearchQuery` | 81 | Destructured from store but never used | **RESEARCH** - Are filters displayed in UI? |

**DECISION NEEDED:**
- **Option A:** Remove dead function, implement filter UI if filters should work
- **Option B:** Remove everything (filters not needed)

**My Recommendation:** Research UI first - if there are filter controls in the UI, implement them. If not, remove.

---

### 2. DUPLICATE IMPLEMENTATIONS - Which to Keep?

#### A. Admin Dashboards (ALREADY RESEARCHED)

| Component | LOC | Status | Used In Production? | Recommendation |
|-----------|-----|--------|-------------------|----------------|
| ComprehensiveAdminDashboard | 965 | ✅ Full features | ✅ YES `/admin/dashboard` | **KEEP & ENHANCE** |
| AdminDashboard | 311 | ✅ Modular | ⚠️ Unknown | **RESEARCH** - Check usage |
| SimpleAdminDashboard | 190 | "Replaces" Comprehensive | ❌ NO - Not imported | **ARCHIVE** |
| PerformanceDashboard | 327 | Specialized | ✅ YES `/admin/performance` | **KEEP** |

**DECISION:** ✅ Archive SimpleAdminDashboard? (Dead code confirmed)

---

#### B. usePollWizard Implementations

| File | LOC | Status | Errors? |
|------|-----|--------|---------|
| `features/polls/hooks/usePollWizard.ts` | 357 | Unknown | Need to check |
| `shared/utils/lib/usePollWizard.ts` | 350 | Has TypeScript errors | ❌ Broken |
| `lib/hooks/usePollWizard.ts` | 351 | Unknown | Need to check |

**Migration Guide Says:** Migrating to `usePollWizardStore` (Zustand)

**NEED TO RESEARCH:**
- Is Zustand store complete?
- Which hook is currently used in components?
- Is migration finished or in-progress?

**DECISION NEEDED:** 
- **Option A:** Complete migration to Zustand store (remove all 3 hooks)
- **Option B:** Pick one canonical hook, archive other 2
- **Recommendation:** Need 30 min research to determine

---

#### C. poll-service Implementations

| File | LOC | Status | Notes |
|------|-----|--------|-------|
| `features/polls/lib/poll-service.ts` | 583 | Has comment: "Replaces old service" | ✅ CANONICAL |
| `shared/core/services/lib/poll-service.ts` | 593 | Has TypeScript errors (missing logger) | ❌ OLD |

**DECISION:** ✅ Migrate imports to `features/polls/lib/poll-service.ts`, archive old one?

---

#### D. SSR Utilities (6 files!)

| File | LOC | Usage Count |
|------|-----|-------------|
| `lib/ssr-safe.ts` | 53 | 6 imports |
| `lib/utils/ssr-safe.ts` | 217 | Unknown |
| `lib/ssr-polyfills.ts` | 41 | Unknown |
| `shared/lib/ssr-safe.ts` | 111 | Unknown |
| `shared/utils/lib/ssr-safe.ts` | 203 | Unknown |
| `shared/utils/lib/ssr-polyfills.ts` | 177 | Unknown |

**NEED TO RESEARCH:** Which is most complete and widely used?

**DECISION:** Need 30 min to compare implementations and check imports

---

#### E. BurgerMenu Components

| File | LOC | Differences? |
|------|-----|--------------|
| `components/shared/BurgerMenu.tsx` | 326 | Need diff |
| `components/navigation/BurgerMenu.tsx` | 325 | Need diff |

**NEED TO RESEARCH:** Run diff to see if they're identical or have differences

**DECISION:** Merge if different, pick one if identical - 15 min research

---

### 3. PARTIAL IMPLEMENTATIONS - Complete or Document?

#### A. SiteMessagesAdmin Edit Feature

**File:** `components/admin/SiteMessagesAdmin.tsx`

**Status:** 
- Has `_editingMessage` state defined
- Has `_handleUpdateMessage` function
- NO edit button wired up
- NO edit form UI

**NEED TO RESEARCH:** Is this component even used? Or is ComprehensiveAdminDashboard the only one?

**DECISION:**
- If **unused**: Archive entire component
- If **used**: Implement edit feature (~30 min)

---

#### B. Performance Dashboard Stubs

**File:** `lib/performance/optimized-poll-service.ts`

**6 TODOs for stub implementations:**
- Line 60: Poll fetching
- Line 75: Database fetch
- Line 95: Performance stats collection
- Line 132: Cache statistics
- Line 143: Materialized view refresh
- Line 153: Database maintenance

**NEED TO RESEARCH:** Are these functions called anywhere? Or just stubs for future?

**DECISION:**
- If **called**: Implement basic functionality
- If **not called**: Add `@deprecated` comment, document as future

---

#### C. Internationalization (i18n)

**File:** `hooks/useI18n.ts`

**Status:** Complete stub with 3 TODOs

**DECISION:**
- **Option A:** Implement basic i18n (~4 hours NEW work)
- **Option B:** Document as future feature (5 min)
- **Recommendation:** Option B - Too much new work

---

### 4. STRAIGHTFORWARD FIXES (No Decision Needed)

These I can proceed with immediately:

- ✅ Fix NodeJS type errors (add `/// <reference types="node" />`)
- ✅ Update ESLint config for Jest globals
- ✅ Fix `react/no-unescaped-entities` (replace `'` with `&apos;`)
- ✅ Fix `no-case-declarations` (wrap case blocks in braces)
- ✅ Fix `prefer-optional-chain` (change `a && a.b` to `a?.b`)
- ✅ Remove `uniqueUsers` from sophisticated-analytics.ts (already done)

---

## 📋 APPROVAL CHECKLIST

### **I NEED YOUR APPROVAL ON:**

**Priority 1 - Dead Code vs Features:**

1. ⏸️ **UnifiedFeed 6 helper functions** - Implement features or remove dead code?
   - My recommendation: **IMPLEMENT** (functions support intended comprehensive features)
   - Effort: ~1.5 hours
   - Your decision: [ ] Implement [ ] Remove [ ] Document as future

2. ⏸️ **HashtagTrending filter hook** - Implement filters or remove?
   - My recommendation: **Research UI first**, then decide
   - Effort: 15 min research + 30 min if implementing
   - Your decision: [ ] Research & implement if UI exists [ ] Remove

**Priority 2 - Consolidation:**

3. ⏸️ **SimpleAdminDashboard** - Archive as dead code?
   - Status: Not imported anywhere
   - Your decision: [ ] Archive [ ] Keep with justification

4. ⏸️ **poll-service** - Migrate to features/polls version?
   - Canonical already identified in code
   - Effort: 30 min
   - Your decision: [ ] Proceed with migration [ ] Wait

5. ⏸️ **usePollWizard 3x** - Which approach?
   - Need 30 min research first
   - Your decision: [ ] Research & consolidate [ ] Skip for now

6. ⏸️ **SSR utilities 6x** - Consolidate?
   - Need 30 min research first
   - Your decision: [ ] Research & consolidate [ ] Skip for now

7. ⏸️ **BurgerMenu 2x** - Consolidate?
   - Need 15 min diff first
   - Your decision: [ ] Diff & merge [ ] Skip for now

**Priority 3 - Partial Features:**

8. ⏸️ **SiteMessagesAdmin** - Implement edit feature?
   - Need to check if component is used
   - Effort: 30 min if implementing
   - Your decision: [ ] Research usage first [ ] Skip

9. ⏸️ **Performance stubs** - Implement or document?
   - Need to check if functions are called
   - Your decision: [ ] Research & implement if needed [ ] Document as future

10. ⏸️ **Internationalization** - Implement or document?
    - Would be 4+ hours of NEW work
    - Your decision: [ ] Skip (out of scope) [ ] Document only

---

## 🚀 MY RECOMMENDED PRIORITIES (for your approval)

### **Continue Phase 1** (Simple fixes, ~30 min):
1. ✅ Fix NodeJS types
2. ✅ Fix Jest config
3. ✅ Fix simple lint errors (unescaped entities, etc)

### **Then Phase 2** (Low-hanging fruit, ~2 hours):
4. ✅ Archive SimpleAdminDashboard
5. ✅ Consolidate poll-service (canonical identified)
6. ✅ Research & consolidate usePollWizard
7. ✅ Research & consolidate SSR utilities
8. ✅ Diff & merge BurgerMenu

### **Then Phase 3** (Features vs Removal, ~2-3 hours):
9. ⏸️ **DECISION:** UnifiedFeed - Implement 6 functions OR remove
10. ⏸️ **DECISION:** HashtagTrending - Implement filters OR remove
11. ⏸️ Check if SiteMessagesAdmin is used

### **Then Phase 4** (Partial features, case-by-case):
12. ⏸️ Each TODO reviewed individually

### **Then Phase 5** (Remaining lint, ~6 hours):
13. ✅ Fix all remaining lint errors with quality-first approach

---

## ❓ WHAT I NEED FROM YOU RIGHT NOW:

**Quick Decisions:**

1. **UnifiedFeed functions** - Implement or remove?
   - [ ] **IMPLEMENT** - Wire all 6 functions into UI (1.5 hrs)
   - [ ] **REMOVE** - Delete dead code (15 min)
   - [ ] **DEFER** - Handle in Phase 4

2. **Consolidation approach** - How aggressive?
   - [ ] **AGGRESSIVE** - Research & consolidate everything in Phase 2
   - [ ] **CONSERVATIVE** - Only clear duplicates (poll-service, SimpleAdmin)
   - [ ] **DEFER** - Focus on lint errors first, consolidation later

3. **Partial features** - Default approach?
   - [ ] **IMPLEMENT** - Complete features if <1 hour effort
   - [ ] **DOCUMENT** - Mark as future, focus on lint errors
   - [ ] **CASE BY CASE** - Ask for each one

---

## ⏭️ WHAT I'LL DO WHILE WAITING:

- Continue Phase 1 simple fixes (NodeJS types, Jest config)
- Fix straightforward lint errors
- Research duplicates for better recommendations

---

**Awaiting your decisions to proceed efficiently.**

**Status:** 🟡 PENDING USER INPUT  
**Updated:** 2025-11-03 19:45 UTC

