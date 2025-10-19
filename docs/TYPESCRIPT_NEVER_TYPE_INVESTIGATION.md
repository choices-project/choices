# TypeScript `never` Type Investigation

**Created:** October 19, 2025  
**Status:** 🔍 **INVESTIGATING ROOT CAUSE**

## Problem Statement

The Supabase client is returning `never` types for all database queries, despite having a properly structured `Database` type definition. This causes TypeScript to reject all property access on query results.

**Example Error:**
```typescript
const { data: poll } = await supabase.from('polls').select('*').single()
// TypeScript error: Property 'created_by' does not exist on type 'never'
```

## What We Know

### ✅ Working Components
1. **Database Type Structure**: The `Database` type in `types/database-complete-121.ts` is properly structured
2. **Type Accessibility**: TypeScript can access `Database['public']['Tables']['polls']['Row']` successfully
3. **Supabase Client Creation**: `createServerClient<Database>(...)` is properly typed
4. **Schema File Compiles**: `database-complete-121.ts` compiles without errors

### ❌ Failing Components
1. **Query Return Types**: All `.from('table').select()` queries return `never` types
2. **Property Access**: Cannot access properties on query results
3. **Build Failure**: Project fails to compile due to `never` type errors

## What We Tried (WRONG APPROACH)

**Applied `as any` type assertions to 12 files** ❌
- This is a band-aid that defeats TypeScript's purpose
- Does NOT solve the root cause
- Makes the codebase less safe
- Should be REVERTED

## Root Cause Investigation

### Theory 1: Database Type Structure Mismatch
The generated `Database` type structure might not match what Supabase expects.

**Evidence:**
- Supabase docs recommend using `supabase gen types typescript` to generate types
- Our types were manually generated using custom scripts
- May have structural differences from official Supabase type format

### Theory 2: Supabase Version Compatibility
There might be a version mismatch between:
- `@supabase/supabase-js` (2.75.1)
- `@supabase/ssr` (0.7.0)
- Database schema version

### Theory 3: TypeScript Configuration Issue
The `tsconfig.json` might have settings that interfere with type inference.

## Proper Solution Path

### Step 1: Authenticate with Supabase CLI
```bash
npx supabase login
```

### Step 2: Generate Official Types
```bash
npx supabase gen types typescript --project-id muqwrehywjrbaeerjgfb > web/types/database-official.ts
```

### Step 3: Compare Generated Types
Compare `database-official.ts` with `database-complete-121.ts` to identify structural differences

### Step 4: Update Imports
Replace all imports of `database-complete-121` with `database-official`

### Step 5: Test Build
```bash
npm run build
```

## Action Items

- [ ] Revert all `as any` type assertions
- [ ] Authenticate with Supabase CLI
- [ ] Generate official types using Supabase CLI
- [ ] Compare type structures
- [ ] Update imports to use official types
- [ ] Test build and verify queries work
- [ ] Document the correct approach

## Lessons Learned

1. **Don't use `as any` as a solution** - It's a symptom suppressor, not a fix
2. **Use official tools** - Supabase provides `gen types` for a reason
3. **Investigate root causes** - Type errors are usually structural issues
4. **Test incrementally** - Should have tested one fix before applying to all files

---

**Next Step:** Revert the `as any` changes and use the official Supabase type generation tool.
