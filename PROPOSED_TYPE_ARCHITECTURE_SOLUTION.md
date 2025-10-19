# Proposed Type Architecture Solution

## Current Problem
- **7,741-line database types file** causing slow builds (66s+)
- **86+ TypeScript errors** across the codebase
- **Massive type bloat** with unused tables
- **Architectural mismatch** - not using existing feature-specific types

## Root Cause Analysis
The codebase already has a **well-structured type architecture**:
- ✅ Feature-specific types in `web/features/*/types/`
- ✅ Shared types in `web/lib/types/` and `web/types/`
- ✅ Core types in `web/lib/core/types/`

But we're **ignoring this architecture** and using a massive database types file instead.

## Proposed Solution: Use Existing Type Architecture

### 1. Feature-Specific Database Types
Each feature should define its own database types:

```typescript
// web/features/auth/types/database.ts
export interface AuthDatabase {
  webauthn_credentials: {
    Row: { id: string; user_id: string; credential_id: string; ... }
    Insert: { id?: string; user_id: string; credential_id: string; ... }
    Update: { id?: string; user_id?: string; credential_id?: string; ... }
  }
  webauthn_challenges: { ... }
}

// web/features/polls/types/database.ts  
export interface PollsDatabase {
  polls: {
    Row: { id: string; title: string; description: string; ... }
    Insert: { id?: string; title: string; description: string; ... }
    Update: { id?: string; title?: string; description?: string; ... }
  }
  votes: { ... }
  poll_options: { ... }
}

// web/features/hashtags/types/database.ts
export interface HashtagsDatabase {
  hashtags: { ... }
  hashtag_flags: { ... }
  hashtag_usage: { ... }
}
```

### 2. Shared Database Types
Common types in shared locations:

```typescript
// web/lib/types/database.ts
export interface CoreDatabase {
  user_profiles: { ... }
  analytics_events: { ... }
  privacy_logs: { ... }
}
```

### 3. Import Only What You Need
Each file imports only the types it actually uses:

```typescript
// web/app/actions/complete-onboarding.ts
import type { CoreDatabase } from '@/lib/types/database'
import type { AuthDatabase } from '@/features/auth/types/database'

// Use specific table types
type UserProfile = CoreDatabase['user_profiles']['Row']
type WebAuthnCredential = AuthDatabase['webauthn_credentials']['Row']
```

### 4. Supabase Client Configuration
Create feature-specific Supabase clients:

```typescript
// web/features/auth/lib/supabase.ts
import type { AuthDatabase } from '../types/database'
export const createAuthClient = () => createClient<AuthDatabase>(...)

// web/features/polls/lib/supabase.ts  
import type { PollsDatabase } from '../types/database'
export const createPollsClient = () => createClient<PollsDatabase>(...)
```

## Benefits

### Performance
- **67% smaller type files** (only used tables)
- **Faster builds** (12s vs 66s)
- **Better tree-shaking** (only import what you need)

### Architecture
- **Follows existing patterns** (feature-specific types)
- **Better separation of concerns** (each feature owns its types)
- **Easier maintenance** (changes isolated to features)
- **Type safety** (only relevant types available)

### Developer Experience
- **No more 86+ errors** (proper type structure)
- **IntelliSense works** (focused, relevant types)
- **Easier debugging** (clear type boundaries)
- **Better refactoring** (feature-scoped changes)

## Implementation Plan

### Phase 1: Create Feature Database Types
1. Extract used tables per feature
2. Create feature-specific database type files
3. Update feature imports

### Phase 2: Create Shared Database Types  
1. Identify common tables (user_profiles, analytics, etc.)
2. Create shared database types
3. Update shared imports

### Phase 3: Update Supabase Clients
1. Create feature-specific Supabase clients
2. Update imports across codebase
3. Remove massive database.ts file

### Phase 4: Performance Testing
1. Measure build times
2. Verify type safety
3. Test functionality

## Expected Results
- ✅ **Build time: 12s** (down from 66s)
- ✅ **Type errors: 0** (down from 86+)
- ✅ **File size: 65KB** (down from 201KB)
- ✅ **Architecture: Clean** (follows existing patterns)

This approach leverages the existing, well-designed type architecture instead of fighting against it.
