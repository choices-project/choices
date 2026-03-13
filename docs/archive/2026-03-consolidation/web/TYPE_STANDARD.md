# Type System Standard - DEFINITIVE RULES

**Status**: ✅ ENFORCED - All types MUST follow this pattern
**Last Updated**: November 5, 2025
**Purpose**: Ensure cohesive, obvious type system that makes perfect sense to any agent

---

## 🎯 THE GOLDEN RULE

**All types MUST derive from the database schema first, then extend when needed.**

This ensures:
- ✅ Types always match actual database
- ✅ No drift between code and reality
- ✅ Obvious source of truth
- ✅ Easy to regenerate and maintain

---

## 📐 THE STANDARD PATTERN

### Pattern 1: Global Shared Types (types/[entity].ts)

Used when entity is used across multiple features.

```typescript
/**
 * [Entity] Types
 * 
 * Type definitions based on database schema with extensions for UI/business logic
 * 
 * Database Table: [table_name]
 * Status: ✅ ACTIVE
 */

import type { Database } from './database';

// ============================================================================
// BASE TYPES FROM DATABASE
// ============================================================================

export type EntityRow = Database['public']['Tables']['table_name']['Row'];
export type EntityInsert = Database['public']['Tables']['table_name']['Insert'];
export type EntityUpdate = Database['public']['Tables']['table_name']['Update'];

// ============================================================================
// EXTENDED TYPES (if needed)
// ============================================================================

export type Entity = EntityRow & {
  // Only add computed/enriched fields that aren't in DB
  computedField?: string;
  displayName?: string;
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export type EntityQuery = { ... }
export type EntityResponse = { ... }

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export type EntityCardProps = { ... }

// ============================================================================
// CONSTANTS
// ============================================================================

export const ENTITY_CONSTANTS = { ... } as const;
```

### Pattern 2: Feature-Specific Types (features/[feature]/types/index.ts)

Used when types are specific to one feature.

```typescript
/**
 * [Feature] Types
 * 
 * Type definitions for [feature] functionality
 * Based on database schema: [table_names]
 * 
 * Status: ✅ ACTIVE
 */

import type { Database } from '@/types/database';

// ============================================================================
// BASE TYPES FROM DATABASE
// ============================================================================

export type FeatureRow = Database['public']['Tables']['feature_table']['Row'];
export type FeatureInsert = Database['public']['Tables']['feature_table']['Insert'];
export type FeatureUpdate = Database['public']['Tables']['feature_table']['Update'];

// ============================================================================
// ENRICHED TYPES (if needed)
// ============================================================================

export type Feature = FeatureRow & {
  // Only computed/enriched fields
  enrichedField?: string;
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export type FeatureAction = { ... }
export type FeatureQuery = { ... }
```

### Pattern 3: Simple Type Aliases (when no extension needed)

```typescript
import type { Database } from '@/types/database';

// Direct aliases when no extension is needed
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
```

---

## 📁 FILE ORGANIZATION RULES

### Where to Put Types

| Type Scope | Location | Example |
|------------|----------|---------|
| **Database table types** | `types/supabase.ts` | Auto-generated, NEVER edit manually |
| **Shared across features** | `types/[entity].ts` | `types/profile.ts`, `types/representative.ts` |
| **Single feature only** | `features/[feature]/types/index.ts` | `features/polls/types/index.ts` |
| **Store infrastructure** | `lib/stores/types.ts` | `BaseStore`, `StoreMiddleware` |
| **Component props** | Co-located with component OR feature types | `features/polls/types/index.ts` |

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| **Database row** | `[Entity]Row` | `UserProfileRow`, `PollRow` |
| **Database insert** | `[Entity]Insert` | `UserProfileInsert`, `PollInsert` |
| **Database update** | `[Entity]Update` | `UserProfileUpdate`, `PollUpdate` |
| **Enriched/Extended** | `[Entity]` (no suffix) | `UserProfile`, `Poll` |
| **Query types** | `[Entity]Query` | `PollQuery`, `RepresentativeQuery` |
| **Response types** | `[Entity]Response` | `PollResponse`, `ApiResponse` |
| **Component props** | `[Component]Props` | `PollCardProps`, `ProfileEditProps` |

---

## ✅ CORRECT EXAMPLES

### ✅ GOOD: types/profile.ts
```typescript
import type { Database } from './database';

// Extract from DB
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];

// Extend with computed fields
export type UserProfile = {
  initials?: string;
  fullName?: string;
} & UserProfileRow;
```

### ✅ GOOD: features/voting/types/index.ts
```typescript
import type { Database } from '@/types/database';

// Direct aliases when no extension needed
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
```

---

## ❌ FORBIDDEN PATTERNS

### ❌ NEVER Redefine Database Types From Scratch
```typescript
// ❌ BAD - Redefining what's already in database
export type Poll = {
  id: string;
  question: string;
  // ... 50 more fields
}

// ✅ GOOD - Import from database
export type Poll = Database['public']['Tables']['polls']['Row'];
```

### ❌ NEVER Put Feature Types in Global types/
```typescript
// ❌ BAD - Poll is feature-specific
// types/poll.ts

// ✅ GOOD - Poll belongs in feature
// features/polls/types/index.ts
```

### ❌ NEVER Define Types Inline in Stores
```typescript
// ❌ BAD - Store redefining Poll
type PollsStore = {
  polls: Poll  // where Poll is defined inline in this file
}

// ✅ GOOD - Store imports from feature
import type { Poll } from '@/features/polls/types';
type PollsStore = {
  polls: Poll[];
}
```

### ❌ NEVER Use Partial DB Type When Full Type Exists
```typescript
// ❌ BAD
type Poll = {
  id: string;
  question: string;
}

// ✅ GOOD - Use full DB type
export type Poll = Database['public']['Tables']['polls']['Row'];
```

---

## 🔄 REGENERATION WORKFLOW

### When Database Schema Changes:

1. **Regenerate types**:
   ```bash
   npm run types:generate
   ```

2. **Review changes**:
   ```bash
   git diff types/supabase.ts
   ```

3. **Update feature types** (if needed):
   - Check if extensions need updates
   - Verify computed fields still make sense

4. **Fix TypeScript errors**:
   - Types will auto-update
   - Fix any breaking changes in code

---

## 🎓 FOR AGENTS: Decision Tree

```
Is this a database table?
├─ YES → Use Database['public']['Tables']['table']['Row']
│         └─ Put in types/supabase.ts? NO - auto-generated!
│
└─ NO → Is this used by multiple features?
        ├─ YES → types/[entity].ts
        │         └─ Import Database, extract Row/Insert/Update
        │
        └─ NO → features/[feature]/types/index.ts
                  └─ Import Database, extract Row/Insert/Update
```

---

## 📋 CHECKLIST FOR NEW TYPES

Before creating any type file:

- [ ] Is this type in the database? → Use Database type alias
- [ ] Does it need extension? → Use intersection type (`&`)
- [ ] Is it shared across features? → `types/[entity].ts`
- [ ] Is it feature-specific? → `features/[feature]/types/index.ts`
- [ ] Does it follow naming conventions? → `[Entity]Row`, `[Entity]`, etc.
- [ ] Does it import from `@/types/database`? → Required for DB types
- [ ] Have I checked for existing types? → `grep -r "export type Entity"`

---

## 🚨 RED FLAGS

If you see any of these, **FIX IMMEDIATELY**:

- ❌ Type defined in multiple files
- ❌ Type doesn't import from Database
- ❌ Type redefines DB fields manually
- ❌ Store file defines domain types inline
- ❌ Feature type in global `types/` (unless shared)
- ❌ Global type in `features/` (unless truly feature-specific)

---

**This is the standard. No exceptions. All types MUST follow this pattern.**
