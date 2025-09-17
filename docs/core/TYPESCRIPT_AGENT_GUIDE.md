# TypeScript Agent Guide - One Pager

**Created:** December 19, 2024  
**Updated:** December 19, 2024  
**Status:** Active Reference

## 🚀 Quick Start Commands

```bash
# Fast linting (daily development)
npm run lint

# Type-aware linting (strict checks)
npm run lint:typed

# Type checking
npm run types:ci

# Full CI verification
npm run ci:verify
```

## 📁 Path-Based Rule Tiers

### 🔴 **Strict (Error Level)**
**Files:** `lib/**/*`, `shared/**/*`, `app/api/**/*`
- All `no-unsafe-*` rules are **errors**
- Must fix before merging
- Core business logic and API boundaries

### 🟡 **Pragmatic (Warning Level)**  
**Files:** `app/(app)/**/*`, `components/**/*`
- All `no-unsafe-*` rules are **warnings**
- Fix when convenient, don't block development
- UI components and pages

### 🟢 **Relaxed (Off)**
**Files:** `tests/**/*`, `scripts/**/*`, `archive/**/*`, `**/*.disabled`
- All `no-unsafe-*` rules are **off**
- Focus on functionality, not type safety
- Test files and utility scripts

## 🛡️ Mandatory Safe Boundary Helpers

**Import from:** `lib/util/guards.ts`

### API/IO Boundaries (Required)
```typescript
import { has, toString, toNumber, isRecord } from 'lib/util/guards';

// ❌ Before (triggers no-unsafe-member-access)
const title = body.title;

// ✅ After (type-safe)
if (!has(body, 'title')) throw new Error('Missing title');
const title = toString(body.title);
```

### Common Patterns
```typescript
// Safe property access
const value = has(obj, 'key') ? toString(obj.key) : 'default';

// Safe array handling
const items = asArray(data.items);

// Safe number conversion
const count = toNumber(data.count, 0);

// Safe object validation
if (!isRecord(data)) throw new Error('Invalid data format');
```

## 🧪 Test Mocking (Required)

**Import from:** `tests/helpers/supabase-mock.ts`

### Standard Pattern
```typescript
import { makeMockSupabase, okSingle, errSingle, TestData } from 'tests/helpers/supabase-mock';

describe('My Test', () => {
  const { client, single } = makeMockSupabase();
  
  it('should handle success', async () => {
    single.mockResolvedValue(okSingle(TestData.user()));
    // ... test logic
  });
  
  it('should handle errors', async () => {
    single.mockResolvedValue(errSingle('Test error'));
    // ... test logic
  });
});
```

### ❌ **Never Do This**
```typescript
// Don't create bespoke mocks
const mockClient = { from: jest.fn() } as any;

// Don't use any types in tests
const result: any = await function();
```

## 🚫 **Critical Rules**

### ❌ **Never Add These**
- `parserOptions.project` to base `.eslintrc.cjs`
- Bespoke Supabase mocks in tests
- `any` types without explicit justification
- `eslint-disable` without trailing reason

### ✅ **Always Do These**
- Use path-based rule tiers
- Import from `lib/util/guards.ts` for boundaries
- Use `tests/helpers/supabase-mock.ts` for tests
- Add JSDoc for public functions

## 🔧 **ESLint Disable Rules**

### When Allowed
```typescript
// ✅ With reason
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API response
const legacyData: any = await oldApi();

// ✅ Temporary with TODO
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: Add proper typing
const data = response.body;
```

### When Not Allowed
```typescript
// ❌ No reason
// eslint-disable-next-line @typescript-eslint/no-explicit-any

// ❌ Permanent disable without justification
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
```

## 📊 **Error Categories & Fixes**

### High Priority (Fix First)
1. **`no-unsafe-member-access`** → Use `has()` guard
2. **`no-unsafe-assignment`** → Use type guards
3. **`no-explicit-any`** → Define proper types

### Medium Priority (Fix When Convenient)
4. **`prefer-nullish-coalescing`** → Replace `||` with `??`
5. **`no-unnecessary-condition`** → Remove redundant checks
6. **`array-type`** → Use `T[]` instead of `Array<T>`

### Low Priority (Auto-fix)
7. **`no-inferrable-types`** → Remove redundant type annotations
8. **`no-unused-vars`** → Remove unused variables

## 🎯 **File-Specific Guidelines**

### API Routes (`app/api/**/*`)
```typescript
// ✅ Required pattern
import { z } from 'zod';
import { has, toString } from 'lib/util/guards';

const Schema = z.object({
  title: z.string().min(1),
  description: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = Schema.parse(body);
    // ... logic
  } catch (error) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

### Components (`components/**/*`)
```typescript
// ✅ Required pattern
interface ComponentProps {
  data: DataType;
  onUpdate: (value: string) => void;
}

export function MyComponent({ data, onUpdate }: ComponentProps) {
  // ... component logic
}
```

### Tests (`tests/**/*`)
```typescript
// ✅ Required pattern
import { makeMockSupabase, okSingle, TestData } from 'tests/helpers/supabase-mock';

describe('My Test', () => {
  const { client, single } = makeMockSupabase();
  
  it('should work', async () => {
    single.mockResolvedValue(okSingle(TestData.user()));
    // ... test logic
  });
});
```

## 🚨 **Emergency Procedures**

### If CI Fails
1. Check which tier the failing file is in
2. If strict tier: fix immediately
3. If pragmatic tier: can be warning
4. If relaxed tier: should not fail

### If Type Errors Cascade
1. Start with `lib/util/guards.ts` boundaries
2. Fix API routes first
3. Then components
4. Tests last

### If Performance Issues
1. Use `npm run lint` (fast) for development
2. Use `npm run lint:typed` only for CI
3. Check `tsconfig.eslint.json` is minimal

## 📈 **Success Metrics**

### Immediate Wins
- ✅ Fast development experience
- ✅ Editor remains responsive
- ✅ CI passes consistently
- ✅ Tests compile cleanly

### Long-term Goals
- ✅ Type safety in critical paths
- ✅ Consistent error handling
- ✅ Maintainable test suite
- ✅ Developer productivity

## 🔗 **Quick Reference Links**

- **Guards:** `lib/util/guards.ts`
- **Mocks:** `tests/helpers/supabase-mock.ts`
- **Config:** `.eslintrc.type-aware.cjs`
- **TypeScript:** `tsconfig.eslint.json`

---

**Remember:** The goal is **pragmatic type safety** - strict where it matters, flexible where it doesn't. Focus on the critical paths first, and let the tooling guide you to the rest.
