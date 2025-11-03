# Quality-First Lint Fixing Strategy

**Date:** 2025-11-03  
**Status:** ACTIVE

## Core Principles

1. **UNDERSTAND before CHANGE**
2. **IMPLEMENT, don't silence**
3. **NO bulk replacements**
4. **Each fix must improve code quality AND correctness**

## Current Error Breakdown

- 73 `prefer-nullish-coalescing` - REQUIRES CONTEXT ANALYSIS
- 121 `no-unused-vars` - REQUIRES FEATURE DECISION
- 159 `no-undef` - REQUIRES TYPE INVESTIGATION
- Total: ~406 errors

## Decision Matrix for `||` vs `??`

### KEEP `||` when:
1. Boolean logic: `if (!a || !b)`, `return a || b || c`
2. Truthy checks: `!!(userId || pollId)`, `enabled: !!(a || b)`
3. Want to catch falsy values: `value || 'default'` when '' should trigger default

### CHANGE to `??` when:
1. Default for null/undefined ONLY: `name ?? 'Guest'`, `items ?? []`
2. API responses where null/undefined expected: `response.data ?? {}`
3. Optional chaining result: `user?.name ?? 'Unknown'`

### Example Analysis Required:

```typescript
// BEFORE FIXING, ASK:
if (!userId || !username) { }
// → Boolean logic check, KEEP ||

const name = data.name || 'Guest';
// → DEPENDS: If empty string should trigger 'Guest', KEEP ||
// → If only null/undefined should trigger 'Guest', CHANGE to ??

enabled: !!(userId || pollId)
// → Boolean truthiness check, KEEP ||
```

## Decision Matrix for Unused Variables

### PREFIX with `_` when:
1. Required by interface but not used in implementation
2. Destructured for side effects
3. Future feature documented in TODO/issue

### IMPLEMENT when:
1. Feature is needed for completeness
2. Data is available and should be displayed
3. Improves user experience

### REMOVE when:
1. Dead code with no purpose
2. Experiment that didn't pan out
3. Duplicate functionality

## Fixing Workflow

For EACH error:

1. **READ** surrounding context (10+ lines)
2. **UNDERSTAND** what the code does
3. **DECIDE** correct fix based on decision matrix
4. **VERIFY** fix doesn't change behavior (unless intentional)
5. **TEST** mentally or actually run the code
6. **DOCUMENT** if decision is non-obvious

## File-by-File Strategy

1. Group errors by file
2. Fix all errors in ONE file at a time
3. Re-lint that file to verify
4. Move to next file
5. Commit after each file or small group of files

## Quality Checkpoints

Before committing:
- [ ] Did I understand WHY this was flagged?
- [ ] Is my fix the ROOT CAUSE solution?
- [ ] Does this improve code quality?
- [ ] Would this pass senior engineer review?
- [ ] Did I introduce any bugs?

## Anti-Patterns to AVOID

❌ Bulk find-replace across multiple files
❌ Prefixing ALL unused vars without investigation
❌ Changing `||` to `??` without understanding context
❌ Adding `// eslint-disable` without justification
❌ Rushing to hit percentage goals

## Success Metrics

✅ Zero bugs introduced
✅ Each fix improves code quality
✅ All fixes are intentional and documented
✅ Team can understand why each change was made

---

**Remember:** 
- **Speed is not the goal, QUALITY is**
- **It's better to fix 10 errors correctly than 100 incorrectly**
- **When in doubt, ask or investigate deeper**

