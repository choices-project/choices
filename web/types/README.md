# Database Types - CANONICAL LOCATION

**⚠️ READ THIS BEFORE GENERATING OR IMPORTING TYPES ⚠️**

## 🎯 THE RULE (No Exceptions)

**ONLY ONE file contains Supabase database types:**

```
web/types/supabase.ts
```

**Period. No other locations. Ever.**

## ✅ To Regenerate Types

```bash
cd web
npm run types:generate

# This runs:
# npx supabase gen types typescript --project-id muqwrehywjrbaeerjgfb > types/supabase.ts
```

## ✅ To Import Types

```typescript
import type { Database } from '@/types/supabase'
```

**Allowed aliases** (all redirect to canonical):
```typescript
import type { Database } from '@/types/database'  // OK - wrapper that imports from supabase.ts
```

## ❌ FORBIDDEN

```typescript
// ❌ DO NOT create new type files
web/utils/supabase/database.types.ts  // DELETED
web/lib/types/database.ts               // DELETED  
web/types/db.ts                         // DON'T CREATE
web/schema.ts                           // DON'T CREATE

// ❌ DO NOT define Database types inline
export type Database = { ... }  // NEVER DO THIS

// ❌ DO NOT import from old locations
import type { Database } from '@/utils/supabase/database.types'  // OLD, DELETED
import type { Database } from './database.types'                 // NEVER
```

## 📋 Files in This Directory

- `supabase.ts` - **CANONICAL** - Supabase-generated database types (3,731 lines, all 67 tables)
- `database.ts` - Convenience wrapper that imports from `supabase.ts` and exports type aliases
- `README.md` - **THIS FILE** - Instructions to prevent confusion

**All other .ts files in this directory are application types, NOT database schema types.**

## 🚫 If You Find Duplicate Types

**DO NOT keep them "just in case".**

1. Delete the duplicate immediately
2. Update imports to use `@/types/supabase`
3. Document in git commit message

## 🔄 Type Generation History

- Nov 4, 2025 20:01 - Generated to `types/supabase.ts` (current)
- OLDER locations have been DELETED

## 🎯 Why This Matters

**The Problem**: When types exist in multiple locations:
- Code imports from different sources
- Some get outdated (missing tables)
- TypeScript shows "Property does not exist on type 'never'"
- ~200+ errors cascade from this single issue
- Future agents waste hours debugging

**The Solution**: ONE canonical location, aggressively delete duplicates.

---

**Last Updated**: November 5, 2025
**Enforced By**: This README + code review
**Violation**: Zero tolerance - delete on sight
