# Agent Onboarding — Choices Project

**Created:** December 19, 2024  
**Updated:** December 19, 2024  
**Status:** Active Onboarding Guide

## 🚀 TL;DR — Your First 90 Minutes

### 1. Set Runtime Exactly
```bash
# Install Volta (recommended - auto-switches per repo)
curl https://get.volta.sh | bash
volta install node@22.19.0 npm@10.9.3

# Verify
node -v && npm -v
```

**That's it!** Volta automatically switches to the correct versions when you `cd` into the repo.

**Fallback (only if Volta doesn't work):**
```bash
nvm install 22.19.0 && corepack enable && corepack prepare npm@10.9.3 --activate
```

### 2. Install & Check
```bash
cd web
npm ci
npm run types        # tsc --noEmit
npm run lint         # fast base ESLint (no type info)
npm run lint:typed   # type-aware ESLint on strict paths
npm run test -w      # watch tests if you're touching them
```

### 3. Pick a Task & Work in Branch
```bash
git switch -c feat/<short-name>  # or fix/<short-name>
```

**Safe Starter Tasks:**
- Typed normalization pass on a single integration file
- Replace `||` with `??` in one directory (non-UI)
- Add missing `unwrapSingle` usage to 2–3 database reads
- Tests: migrate to shared supabase mock in one flaky test file

## 🏗️ Architecture Quick Map

```
web/
├─ app/                  # Next.js routes (server & client)
│  ├─ api/               # API routes (strictest typing)
│  └─ (app)/             # App UI
├─ components/           # Reusable UI
├─ lib/                  # Core domain logic (strict typing)
│  ├─ integrations/      # External APIs (normalize wire→model)
│  ├─ vote/              # Voting engines & finalize manager
│  ├─ util/              # Guards, object helpers (use these!)
│  └─ logger.ts
├─ tests/                # Unit/integration tests (typed, but pragmatic rules)
└─ scripts/              # Maintenance utilities (non-critical paths)
```

## 📊 TypeScript Strictness Tiers

### 🔴 **Tier A (Strict)**
**Files:** `lib/**/*`, `shared/**/*`, `app/api/**/*`
- **Full type-aware ESLint** with unsafe rules as **errors**
- **Must fix before merging**
- Core business logic and API boundaries

### 🟡 **Tier B (Pragmatic)**
**Files:** `components/**/*`, `app/(app)/**/*`
- **Unsafe rules as warnings**
- Follow patterns but don't fight UI DX
- Fix when convenient, don't block development

### 🟢 **Tier C (Light)**
**Files:** `tests/**/*`, `scripts/**/*`, `archive/**/*`
- **Unsafe rules mostly off**
- Be sensible, not sloppy
- Focus on functionality, not type safety

## 🛠️ Tooling & Commands

### Essential Commands
```bash
# Type checking
npm run types        # tsc --noEmit

# Linting
npm run lint         # fast base ESLint (no type info)
npm run lint:typed   # type-aware ESLint on strict paths
npm run lint:fix     # fixable lint (only for base lint)

# Testing
npm run test         # run tests
npm run test:ci      # CI test run
npm run test -w      # watch mode

# Full verification
npm run ci:verify    # complete CI check
```

### ⚠️ **Critical Rule**
**Never add `parserOptions.project` to the base `.eslintrc.cjs`** - type-aware rules already live in the separate strict config.

## 🏠 House Patterns You Must Follow

### 3.1 Wire → Model Normalization (External Data)
**Do not push raw API objects through the app. Normalize at the boundary.**

```typescript
// lib/util/guards.ts (already exists; use it!)
import { has, isRecord, toString, toNumber, asArray } from '@/lib/util/guards';

type RepModel = { name: string; party: string; phone?: string };

export function toRepModel(wire: unknown): RepModel {
  if (!isRecord(wire) || !has(wire, 'name')) throw new Error('Bad wire');
  return {
    name: toString(wire.name),
    party: toString((wire as any).party ?? 'Independent'),
    ...(toString((wire as any).phone, '') && { phone: toString((wire as any).phone) }),
  };
}
```

### 3.2 Safe Boundary Helpers (Required)
**Import from:** `lib/util/guards.ts`

```typescript
import { has, toString, toNumber, isRecord, asArray } from 'lib/util/guards';

// ❌ Before (triggers no-unsafe-member-access)
const title = body.title;

// ✅ After (type-safe)
if (!has(body, 'title')) throw new Error('Missing title');
const title = toString(body.title);

// Common patterns
const value = has(obj, 'key') ? toString(obj.key) : 'default';
const items = asArray(data.items);
const count = toNumber(data.count, 0);
```

### 3.3 Optional Properties & Null-Safety
**`exactOptionalPropertyTypes` is on. Never assign undefined; use conditional spreads.**

```typescript
import { withOptional } from '@/lib/util/objects';

const payload = withOptional(
  { id },
  { cashOnHand, totalReceipts, cycle } // only copies keys with non-nullish values
);

// Use assertions when required and meaningful
import { assertPresent } from '@/lib/util/guards';
assertPresent(poll, 'poll');
```

### 3.4 Supabase Response Handling
**Use the shared helper for singles:**

```typescript
import { unwrapSingle } from '@/lib/db/safe-select';
const row = unwrapSingle(await supabase.from('polls').select('*').eq('id', id).single());
if (!row) return null;
```

### 3.5 Tests — One Mock Factory (Required)
**Only use the provided Supabase mock helpers:**

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

**❌ Never Do This:**
```typescript
// Don't create bespoke mocks
const mockClient = { from: jest.fn() } as any;

// Don't use any types in tests
const result: any = await function();
```

## 🚫 What Not to Do (Hard Guardrails)

- ❌ **Don't add or modify `parserOptions.project` in the base ESLint config**
- ❌ **Don't re-export 3rd-party libs (e.g., lucide-react) via our UI barrels**
- ❌ **Don't assign undefined to optional fields. Use conditional spread**
- ❌ **Don't pull server-only modules (pg, fs, etc.) into client code**
- ❌ **Don't commit ad-hoc test mocks. Use `tests/helpers`**
- ❌ **Don't bypass types with `as any` outside tests. In tests, keep it minimal and justified**
- ❌ **Don't change Node/npm versions per subfolder. Use the pinned toolchain above**

## 🎯 Error Categories & Fixes

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

## 📋 File-Specific Guidelines

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

## 🔧 ESLint Disable Rules

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

## ✅ Definition of Done (For Any PR)

- ✅ **`npm run types` passes**
- ✅ **`npm run lint` passes (no warnings left behind)**
- ✅ **`npm run lint:typed` passes for files you touched**
- ✅ **Tests relevant to your change pass locally**
- ✅ **No `any` added in non-test code**
- ✅ **Normalization at boundaries (no raw wire in domain)**
- ✅ **PR includes a brief "Why / How / Risk" note**

**PR title format:** `feat|fix|chore: <scope> — <short description>`

## 🚨 Debugging Common Pitfalls

### "Why thousands of ESLint errors?"
You probably ran the typed config across the entire repo. Use `npm run lint` for speed; `lint:typed` is scoped and slower by design.

### "Mock is inferred as never / mockResolvedValue missing?"
You mixed `jest.Mocked` with an incompatible shape. Use `tests/helpers/supabase-mock`.

### "node / npm mismatch"
Install via Volta or nvm & corepack (see top). Do not rely on system Node.

**We use Node 22.19.0 and npm 10.9.3.** Install Volta (`curl https://get.volta.sh | bash`) then run `volta install node@22.19.0 npm@10.9.3`. Volta will auto-switch when you `cd` into the repo. CI/Docker use the same versions. Do not run with different Node/npm or commit a lockfile generated by other versions.

### "Type errors cascade"
1. Start with `lib/util/guards.ts` boundaries
2. Fix API routes first
3. Then components
4. Tests last

## 🆘 Ask for Help (The Right Way)

Post in the dev channel with:
- **What you tried**
- **Exact command & error output**
- **File path(s)**
- **What you intend to change**

**Small, frequent PRs beat big "mystery" branches.** We'll keep review fast if you keep scope tight.

## 🎯 Success Metrics

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

## 🔗 Quick Reference Links

- **Guards:** `lib/util/guards.ts`
- **Mocks:** `tests/helpers/supabase-mock.ts`
- **Config:** `.eslintrc.type-aware.cjs`
- **TypeScript:** `tsconfig.eslint.json`

---

**Remember:** The goal is **pragmatic type safety** - strict where it matters, flexible where it doesn't. Focus on the critical paths first, and let the tooling guide you to the rest.

**Thanks & welcome ✨**

This doc is your north star. If you see drift between code and guidance, flag it—consistency is how we keep velocity and quality.
