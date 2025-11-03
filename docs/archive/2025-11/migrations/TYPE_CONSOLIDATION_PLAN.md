# Database Type Consolidation Plan

**Date**: November 3, 2025  
**Issue**: Multiple database type definitions causing confusion  
**Goal**: Single source of truth for all database types

---

## 🎯 Problem

**Multiple Database Type Sources**:
1. `utils/supabase/database.types.ts` - Supabase-generated (3,442 lines) ✅ SOURCE OF TRUTH
2. `types/database.ts` - Custom types (needs review)
3. `utils/supabase/client.ts` - Has own Database definition (outdated)
4. Various `types/*` files - Feature-specific types

**Confusion**: Which to import from?

---

## 📋 Solution: Canonical Type Location

### Strategy: Re-export Pattern

**Canonical Source**: `utils/supabase/database.types.ts` (Supabase-generated)
- This is generated directly from database
- Always accurate
- Updated with `supabase gen types`

**Barrel Export**: `types/database.ts` (Re-exports from canonical)
- Provides convenient import path
- Adds custom types not in database
- Single import location for all database types

**Pattern**:
```typescript
// types/database.ts
// Re-export everything from Supabase-generated types
export * from '@/utils/supabase/database.types'
export type { Database } from '@/utils/supabase/database.types'

// Add custom types that extend database types
export type UserWithProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  // ... custom extensions
}
```

---

## 🔧 Implementation Plan

### Step 1: Update `types/database.ts` to Re-Export

```typescript
/**
 * Database Types - Canonical Import Location
 * 
 * This file re-exports all Supabase-generated database types and adds
 * custom application types that extend the database schema.
 * 
 * IMPORT FROM HERE, NOT FROM utils/supabase/database.types.ts
 * 
 * Example:
 *   import type { Database, Poll, UserProfile } from '@/types/database'
 */

// ============================================================================
// SUPABASE-GENERATED TYPES (Source of Truth)
// ============================================================================

export * from '@/utils/supabase/database.types'
export type { 
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums
} from '@/utils/supabase/database.types'

// ============================================================================
// CONVENIENT TYPE ALIASES
// ============================================================================

import type { Database } from '@/utils/supabase/database.types'

// Table Row Types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type PollOption = Database['public']['Tables']['poll_options']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type CivicAction = Database['public']['Tables']['civic_actions']['Row']
export type Hashtag = Database['public']['Tables']['hashtags']['Row']
export type SiteMessage = Database['public']['Tables']['site_messages']['Row']
export type RepresentativeCore = Database['public']['Tables']['representatives_core']['Row']
export type CandidatePlatform = Database['public']['Tables']['candidate_platforms']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']

// New Tables from Migration
export type PollParticipationAnalytics = Database['public']['Tables']['poll_participation_analytics']['Row']
export type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row']
export type QueryPerformanceLog = Database['public']['Tables']['query_performance_log']['Row']
export type CachePerformanceLog = Database['public']['Tables']['cache_performance_log']['Row']

// Insert Types
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type PollInsert = Database['public']['Tables']['polls']['Insert']
export type VoteInsert = Database['public']['Tables']['votes']['Insert']

// Update Types
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type PollUpdate = Database['public']['Tables']['polls']['Update']

// ============================================================================
// CUSTOM APPLICATION TYPES (Extend Database Types)
// ============================================================================

export type PollWithOptions = Poll & {
  poll_options: PollOption[]
  vote_count: number
}

export type UserWithStats = UserProfile & {
  total_votes: number
  total_polls_created: number
  engagement_score: number
}

// Add more custom types as needed...
```

### Step 2: Deprecate `utils/supabase/client.ts` Database Type

**Currently** `utils/supabase/client.ts` has its own Database type that's outdated.

**Fix**: Use the Supabase-generated type instead
```typescript
// utils/supabase/client.ts
import type { Database } from './database.types'  // Use generated

// Remove the custom Database type definition
// export type Database = { ... }  ❌ DELETE THIS
```

### Step 3: Update All Imports

**Find all files importing Database**:
```bash
grep -r "from '@/utils/supabase/database.types'" web/
```

**Replace with**:
```typescript
// OLD:
import type { Database } from '@/utils/supabase/database.types'

// NEW:
import type { Database } from '@/types/database'
```

**Benefits**:
- Shorter import path
- Easier to refactor later
- Single import location
- Custom types alongside database types

---

## 📊 Migration Script for Types

```bash
#!/bin/bash
# Regenerate database types from Supabase and update imports

echo "🔄 Regenerating database types from Supabase..."
cd /Users/alaughingkitsune/src/Choices/web

# Generate types from Supabase
supabase gen types typescript --linked > utils/supabase/database.types.ts

echo "✅ Types regenerated ($(wc -l < utils/supabase/database.types.ts) lines)"

# Update types/database.ts to re-export
echo "📝 Updating types/database.ts barrel export..."

# (Script would update the file)

echo "✅ Type consolidation complete!"
echo "📋 Next: Update imports across codebase"
```

---

## 🎯 Recommended Structure

```
web/
├── utils/supabase/
│   ├── database.types.ts          ← GENERATED (never edit manually)
│   ├── server.ts                  ← Uses generated types
│   └── client.ts                  ← Uses generated types
│
├── types/
│   ├── database.ts                ← BARREL EXPORT (re-exports + custom types)
│   ├── analytics.ts               ← Application analytics types
│   ├── polls.ts                   ← Application poll types
│   └── ...
│
└── [features]/
    └── [feature]/
        ├── types/
        │   └── index.ts            ← Feature-specific types
        └── ...
```

**Import Pattern**:
```typescript
// ✅ CORRECT: Import from types/database
import type { Database, Poll, UserProfile } from '@/types/database'

// ❌ WRONG: Import directly from utils
import type { Database } from '@/utils/supabase/database.types'
```

---

## 🔄 Auto-Regeneration Workflow

**Create**: `scripts/regenerate-db-types.sh`
```bash
#!/bin/bash
set -e

echo "🔄 Regenerating database types from Supabase..."

cd /Users/alaughingkitsune/src/Choices/web

# Generate types
supabase gen types typescript --linked > utils/supabase/database.types.ts

# Verify file was created
if [ ! -s utils/supabase/database.types.ts ]; then
  echo "❌ Error: Types file is empty or wasn't created"
  exit 1
fi

LINE_COUNT=$(wc -l < utils/supabase/database.types.ts)
echo "✅ Types regenerated: $LINE_COUNT lines"

# Auto-commit if changed
if git diff --quiet utils/supabase/database.types.ts; then
  echo "📋 No changes in database types"
else
  git add utils/supabase/database.types.ts
  echo "📝 Types file updated - ready to commit"
fi

echo "✅ Done! Import from: @/types/database"
```

**Usage**:
```bash
# After any database migration:
./scripts/regenerate-db-types.sh
```

---

## ✅ Action Items

1. **Update `types/database.ts`** - Make it a barrel export
2. **Update `utils/supabase/client.ts`** - Remove custom Database type
3. **Update imports** - Change to import from `@/types/database`
4. **Create regeneration script** - Automate type updates
5. **Document pattern** - Update team docs

**Estimated Time**: 30 minutes

**Expected Result**: 
- Single source of truth: `utils/supabase/database.types.ts` (generated)
- Single import location: `types/database.ts` (barrel export)
- All code imports from `@/types/database`

---

_Ready to implement type consolidation_

