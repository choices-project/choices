# Canonicalization Implementation Plan - Response & Next Steps

**Created:** 2025-01-17  
**Last Updated (UTC):** 2025-01-17  
**Status:** Ready for AI Implementation  
**Purpose:** Response to feedback and implementation plan for systematic canonicalization

---

## 🎯 **Response to Feedback**

### ✅ **Excellent Points - Fully Agreed**

1. **WebAuthn Strategy**: You're absolutely right - **PARK, don't scrap**. Feature flag it off, keep stubs, avoid churn while we finish core voting.

2. **Enforcement Order**: Perfect sequence - guardrails first, then codemod, then delete. Prevents regression.

3. **SSR Safety**: The `/polls/[id]` SSR aborts are the critical blocker. Need SSR-safe loader + error boundary.

4. **DB/Code Drift**: Critical catch! `voting_method` enum mismatch will keep causing SSR failures.

5. **UTC Everywhere**: Essential for flakeless tests. Ship it.

---

## 📋 **Answers to Your 5 Questions**

### 1. **Final Decision on WebAuthn: KEEP ENABLED (Functional)**

**Decision**: **KEEP ENABLED** - WebAuthn is functional and should remain active.

**Current Status**:
- ✅ `WEBAUTHN: true` in feature flags
- ✅ Comprehensive implementation in `/web/features/webauthn/`
- ✅ E2E tests with CDP virtual authenticators working
- ✅ API endpoints functional: `/api/webauthn/authenticate/complete/`
- ✅ Database schema exists for WebAuthn credentials
- ✅ PWA integration with WebAuthn working

**Implementation**:
- Keep `WEBAUTHN: true` in runtime + E2E flags
- WebAuthn tests already properly tagged with `@passkeys`
- Keep `T.webauthn.*` IDs in registry (already working)
- **NO** ESLint bans for WebAuthn components (they're canonical)

**Rationale**: WebAuthn is functional and should not be parked. Focus canonicalization on actual duplicates, not working features.

### 2. **Confirmed Legacy Paths to Ban (Exact Globs)**

```javascript
// ESLint no-restricted-imports patterns
{
  "patterns": [
    { "group": ["@/components/polls/*"], "message": "Use '@/features/polls/*' (canonical)." },
    { "group": ["@/components/voting/*"], "message": "Use '@/features/voting/*' (canonical)." },
    // Note: WebAuthn components are canonical, no bans needed
    { "group": ["@/components/CreatePoll*"], "message": "Use '@/features/polls/components/CreatePollForm.tsx' (canonical)." },
    { "group": ["@/components/admin/layout/*"], "message": "Use '@/app/(app)/admin/layout/*' (canonical)." }
  ]
}
```

**Files to Delete After Codemod**:
- `/web/components/polls/CreatePollForm.tsx`
- `/web/components/CreatePoll.tsx`
- `/web/components/admin/layout/Sidebar.tsx`

**Files to Evaluate** (keep behind feature flags):
- `/web/components/polls/PollCreationSystem.tsx` (complex system with tabs)
- `/web/components/polls/CommunityPollSelection.tsx` (community features)

### 3. **Voting Method Mapping: Code Normalize (Option A)**

**Decision**: **Option A - Code-side normalize**

**Rationale**: 
- DB schema is cleaner with shorter enum values
- Code can handle the mapping layer
- Easier to maintain consistency in database
- Less risk of breaking existing data

**Implementation**:
```typescript
// types/voting.ts
type DbVotingMethod = 'single'|'approval'|'ranked'|'range'|'quadratic'|'multiple';
type UiVotingMethod = 'single_choice'|'approval'|'ranked_choice'|'range'|'quadratic';

const mapDbToUi: Record<DbVotingMethod, UiVotingMethod> = {
  single: 'single_choice',
  approval: 'approval', 
  ranked: 'ranked_choice',
  range: 'range',
  quadratic: 'quadratic',
  multiple: 'single_choice' // treat multiple as single_choice for now
};

const mapUiToDb: Record<UiVotingMethod, DbVotingMethod> = {
  single_choice: 'single',
  approval: 'approval',
  ranked_choice: 'ranked', 
  range: 'range',
  quadratic: 'quadratic'
};
```

### 4. **Base URL Strategy: Relative + Headers()**

**Decision**: **Relative + headers()** approach

**Rationale**:
- More flexible for different environments
- Can forward E2E bypass headers properly
- Avoids hardcoded URLs
- Works better with Next.js App Router

**Implementation**:
```typescript
// web/features/polls/pages/[id]/page.tsx
import { headers } from 'next/headers';

export default async function PollPage({ params }: { params: { id: string } }) {
  const h = headers();
  const e2e = h.get('x-e2e-bypass') === '1' ? { 'x-e2e-bypass': '1' } : {};
  
  try {
    const res = await fetch(`/api/polls/${params.id}`, {
      cache: 'no-store',
      headers: { ...e2e }
    });
    if (!res.ok) throw new Error(`poll load ${res.status}`);
    const poll = await res.json();
    return <PollClient poll={poll} />;
  } catch (err) {
    return <div data-testid="poll-error">Unable to load poll.</div>;
  }
}
```

### 5. **Owners for Canonical Adoption Matrix**

| Capability | Owner | Rationale |
|------------|-------|-----------|
| Poll Create UI | **Agent A** | Currently working on poll system |
| Poll Individual Page | **Agent A** | Missing component needs creation |
| Voting Interface | **Agent A** | E2E bypass pattern already implemented |
| Admin Dashboard | **Agent A** | Admin system already completed |
| Authentication | **Agent A** | WebAuthn parking strategy |

**Note**: All components currently owned by Agent A since we're in consolidation phase. Can reassign later when team grows.

---

## 🚀 **Implementation Sequence (Ready to Execute)**

### Phase 1: Guardrails (Repo-wide) - **IMMEDIATE**

1. **ESLint Bans** - Ship the no-restricted-imports rules
2. **TypeScript Path Redirects** - Add path mappings to tsconfig
3. **Husky Pre-commit** - Block new legacy files
4. **UTC Everywhere** - Set `TZ=UTC` in CI and dev scripts

### Phase 2: Codemod to Move Imports - **NEXT**

1. **Polls**: `@/components/polls/` → `@/features/polls/`
2. **Voting**: `@/components/voting/` → `@/features/voting/`
3. **Auth**: `@/components/auth/Passkey*` → `@/features/auth/*`

### Phase 3: Delete Obvious Dupes - **AFTER CODEMOD**

1. Delete the "DELETE" rows from audit
2. Keep "EVALUATE" ones behind feature flags

### Phase 4: Fix Critical SSR Aborts - **HIGH PRIORITY**

1. **Create missing canonical** `/web/features/polls/pages/[id]/page.tsx`
2. **Add error boundary** `/web/features/polls/pages/[id]/error.tsx`
3. **Fix voting_method mapping** (code-side normalize)
4. **Apply E2E bypass pattern** to poll page

### Phase 5: WebAuthn Maintenance - **PARALLEL**

1. Keep `WEBAUTHN: true` in flags (already functional)
2. WebAuthn routes already working (no changes needed)
3. Playwright config already has `@passkeys` tagging (no changes needed)
4. T.webauthn.* IDs already working (no changes needed)

---

## 🔧 **Additional Implementation Details**

### Dangerfile for Regression Prevention

```javascript
// dangerfile.js
const changed = danger.git.modified_files.concat(danger.git.created_files);

// Block legacy paths
const banned = changed.filter(p => 
  p.startsWith('web/components/polls/') || 
  p.startsWith('web/components/voting/') ||
  p.startsWith('web/components/auth/Passkey')
);
if (banned.length) {
  fail(`Legacy paths touched:\n${banned.join('\n')}`);
}

// Require T registry + spec changes together
const touchedT = changed.some(p => p.endsWith('web/lib/testing/testIds.ts'));
const touchedSpecs = changed.some(p => p.startsWith('web/tests/e2e/'));
if (touchedT && !touchedSpecs) {
  warn('T registry changed without accompanying spec updates.');
}
```

### Playwright Config (Already Correct)

```typescript
// playwright.config.ts - NO CHANGES NEEDED
projects: [
  { 
    name: 'chromium-core', 
    use: { ...devices['Desktop Chrome'] }
    // WebAuthn tests already properly tagged with @passkeys
  },
  { 
    name: 'chromium-passkeys', 
    use: { ...devices['Desktop Chrome'] },
    testMatch: '**/*.spec.ts',
    grep: /@passkeys/ // Already working correctly
  }
]
```

### Import Graph Visualization

```bash
# Generate architecture diagram
npx madge web --extensions ts,tsx --image web/architecture-imports.svg
```

---

## ❓ **Questions for You**

### 1. **Codemod Script Generation**
You mentioned generating the `replace-import.js` transform script. Should I proceed with creating this, or would you prefer to provide it?

### 2. **Feature Flag Strategy**
For the "EVALUATE" components (PollCreationSystem, CommunityPollSelection), should we:
- A) Create new feature flags for each (e.g., `POLL_CREATION_SYSTEM`, `COMMUNITY_FEATURES`)
- B) Use a generic `EXPERIMENTAL_COMPONENTS` flag
- C) Keep them disabled by default until we decide

### 3. **Error Boundary Strategy**
For the poll page error boundary, should we:
- A) Create a generic error boundary component
- B) Create poll-specific error boundary
- C) Use Next.js built-in error.tsx pattern

### 4. **Testing Strategy During Transition**
While we're canonicalizing, should we:
- A) Keep both old and new tests running
- B) Disable old tests and only run canonical tests
- C) Create migration tests that verify old → new behavior

### 5. **Documentation Updates**
Should we update the core documentation files during this canonicalization, or focus purely on the code changes first?

---

## 🎯 **Expected Outcomes**

After implementing this plan:

1. **✅ No More Wheel-Spinning**: Clear canonical paths, no duplicate implementations
2. **✅ SSR Safety**: Poll pages won't crash with `net::ERR_ABORTED`
3. **✅ Regression Prevention**: Automated guardrails prevent future duplication
4. **✅ WebAuthn Maintained**: Already functional, no changes needed
5. **✅ E2E Stability**: UTC everywhere, proper test isolation
6. **✅ Clear Architecture**: Import graph shows canonical structure

---

## 📊 **Success Metrics**

- **Zero** legacy imports in new code (ESLint enforced)
- **Zero** `net::ERR_ABORTED` errors in E2E tests
- **100%** of poll pages use canonical components
- **All** WebAuthn tests already working with `@passkeys` tagging
- **Consistent** voting method mapping across DB and code

---

**This plan provides the roadmap to lock the canon and stop wheel-spinning while maintaining system stability and enabling future feature development.**
