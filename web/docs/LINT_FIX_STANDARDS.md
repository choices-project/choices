# Lint Fix Quality Standards

**Created:** 2025-11-03  
**Purpose:** Define gold standards for lint fixes - NO CORNER CUTTING

## Core Principle
**We fix the ROOT CAUSE, not silence the linter.**

---

## 1. Nullish Coalescing (`??` vs `||`)

### ✅ CORRECT Uses of `??`
When you want to provide a default ONLY for `null` or `undefined`:

```typescript
// Default values for potentially null/undefined
const name = user.name ?? 'Guest';
const items = data.items ?? [];
const count = response.count ?? 0;
const config = options.config ?? DEFAULT_CONFIG;

// API responses
const displayName = profile.displayName ?? profile.username ?? 'User';
```

### ❌ INCORRECT Uses of `??` (BUGS!)
**NEVER use `??` for:**

```typescript
// ❌ WRONG - Boolean logic (use || for OR conditions)
return user.is_admin ?? user.trust_tier === 'T3';  // BUG!
// ✅ CORRECT
return user.is_admin || user.trust_tier === 'T3';

// ❌ WRONG - Truthy checks in boolean expressions
enabled: !!(userId ?? pollId ?? sessionId)  // BUG!
// ✅ CORRECT
enabled: !!(userId || pollId || sessionId)

// ❌ WRONG - When you want falsy fallback (empty string, 0, false)
value || 'default'  // Correct if you want to catch '', 0, false
value ?? 'default'  // Only catches null/undefined

// ❌ WRONG - Error messages with boolean fallback
if (!valid || !data) { }  // Logical OR - keep as ||
```

### When to Use Each:
- **`??`** = "If null or undefined, use this default"
- **`||`** = "If falsy (null, undefined, '', 0, false, NaN), use this default" OR "logical OR condition"

---

## 2. Unused Variables

### ✅ CORRECT Approach
**Analyze WHY it's unused, then choose:**

#### Option A: Variable is truly unused - prefix with `_`
```typescript
// Destructured but not used
const { data: _data, error } = await response.json();

// Parameter required by interface but not used
function handler({ req: _req, context }: HandlerParams) {
  // _req is required by type but not used in this implementation
}
```

#### Option B: Variable SHOULD be used - IMPLEMENT the feature
```typescript
// ❌ WRONG - Just silencing
const _performanceMetrics = useState(...);  // TODO later

// ✅ CORRECT - If it should be used, USE IT or REMOVE IT
// Either implement the feature or remove the unused code entirely
```

### ❌ INCORRECT - Hiding Technical Debt
```typescript
// Don't just prefix everything to silence linter
const _userId = props.userId;  // If userId should be used, USE IT!
```

---

## 3. Import Order

### ✅ CORRECT Fix
Reorder imports following the ESLint rule:
1. React/framework imports
2. Third-party library imports
3. Absolute imports from alias (`@/...`)
4. Relative imports
5. Type imports (can be inline or grouped)

Remove empty lines WITHIN groups, add BETWEEN groups.

### ❌ INCORRECT
Don't just disable the rule or move imports randomly.

---

## 4. Type Safety (`any` → `unknown`)

### ✅ CORRECT Approach
```typescript
// Add proper type guards
function processData(value: unknown) {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid data');
  }
  
  const record = value as Record<string, unknown>;
  // Now safely process record
}
```

### ❌ INCORRECT
```typescript
// Don't just change any → unknown without guards
function processData(value: unknown) {
  return value.someProperty;  // Type error!
}
```

---

## 5. NodeJS Types

### ✅ CORRECT Fix
Add triple-slash directive at top of file:
```typescript
/// <reference types="node" />

// Now NodeJS.Timeout works
let timer: NodeJS.Timeout;
```

### Note
ESLint may still show `no-undef` warning, but TypeScript compiles correctly. This is a known ESLint limitation.

---

## 6. Accessibility (jsx-a11y)

### ✅ CORRECT Fix
**Actually implement accessibility:**
```typescript
// Ensure headings render content
const AlertTitle = ({ children, ...props }) => (
  <h5 {...props}>{children}</h5>  // Renders children!
);
```

### ❌ INCORRECT
```typescript
// Don't suppress or ignore a11y warnings
// These are critical for users with disabilities
```

---

## 7. React Hooks Rules

### ✅ CORRECT Fix
```typescript
// If it calls hooks, it MUST be a hook or component
const _useHashtagFilters = () => {  // Wrong - calls useHashtagStore
  const store = useHashtagStore();  // Hook call!
  return { ... };
};

// CORRECT - Remove hook call or make it a proper hook:
function useHashtagFilters() {  // Proper hook name
  const store = useHashtagStore();
  return { ... };
}
```

---

## Audit Checklist for Each Fix

Before marking a fix complete:

- [ ] Does this fix the ROOT CAUSE or just silence the warning?
- [ ] Have I introduced any logic bugs? (esp. `??` vs `||`)
- [ ] Is the code MORE maintainable after this change?
- [ ] Would this pass code review from a senior engineer?
- [ ] Have I tested the specific scenario this code handles?

---

## Known Issues to Document (Not Fix)

Some ESLint warnings are known limitations:
- `NodeJS is not defined` with triple-slash directive (TypeScript works, ESLint doesn't recognize)

**Document these, don't work around them.**

---

## Summary

**Gold Standard:** Every fix must improve code quality AND correctness.
- Fix nullish coalescing properly (understand `??` vs `||`)
- Fix unused variables by implementing features or documenting why unused
- Fix types by adding guards and proper type narrowing
- Fix accessibility by implementing proper a11y
- NEVER just silence linter to make numbers look good

**When in doubt: IMPLEMENT properly or REMOVE the code.**

