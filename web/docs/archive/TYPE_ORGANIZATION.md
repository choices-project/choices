# Type Organization Guide

**Created:** January 26, 2025  
**Status:** 📋 **REFERENCE DOCUMENTATION**

---

## 🎯 Overview

This document explains the type organization strategy for the Choices platform. As a new developer, understanding this structure will help you know where to import types from and where to add new types.

---

## 📁 Type Directory Structure

### **1. Generated Database Types** 
**Location:** `web/utils/supabase/database.types.ts`

**Purpose:** Auto-generated TypeScript types from Supabase database schema

**How it's created:**
```bash
supabase gen types typescript --linked > web/utils/supabase/database.types.ts
```

**What it contains:**
- Complete database schema types (`Database` type)
- All table definitions (`Tables`, `Views`, `Functions`)
- Row, Insert, Update types for each table

**Key principle:** ⚠️ **NEVER manually edit this file** - it's regenerated from the database schema

---

### **2. Application Types**
**Location:** `web/types/`

**Purpose:** Custom TypeScript types for application logic, extended types, and domain models

**Structure:**
```
web/types/
├── database.ts          # Re-export of generated types (for convenience)
├── profile.ts           # Profile-related types (extends Database types)
├── poll.ts              # Poll-related types
├── representative.ts    # Representative types
├── analytics.ts         # Analytics types
├── features/            # Feature-specific types
│   ├── auth/
│   ├── polls/
│   ├── hashtags/
│   └── ...
└── index.ts             # Centralized type exports
```

**What goes here:**
- Types that extend database types (e.g., `UserProfile` with computed fields)
- Types for UI components
- API request/response types
- Business logic types
- Enums and constants

---

### **3. Utility Database Types**
**Location:** `web/lib/types/database.ts`

**Purpose:** Utility types for database operations, monitoring, and optimization

**What it contains:**
- `QueryResult<T>` - Generic query result wrapper
- `PerformanceMetrics` - Database performance monitoring
- `ConnectionPoolConfig` - Pool configuration types
- Query optimizer types

**Note:** These are separate from schema types - they're for operational concerns

---

## 🔄 Import Strategy

### **For Database Schema Types:**

**✅ RECOMMENDED:**
```typescript
// Import from the generated types file (single source of truth)
import type { Database } from '@/utils/supabase/database.types'

// Or use the convenience re-export
import type { Database } from '@/types/database'
```

**Why both work:**
- `web/types/database.ts` re-exports from `web/utils/supabase/database.types.ts`
- This allows imports to use the cleaner `@/types/database` path
- But the source of truth is always `utils/supabase/database.types.ts`

### **For Application Types:**

```typescript
// Import from the types directory
import type { UserProfile, ProfileUpdateData } from '@/types/profile'
import type { Poll, PollWithVotes } from '@/types/poll'
import type { Representative } from '@/types/representative'

// Or use the centralized index
import type { UserProfile, Poll, Representative } from '@/types'
```

### **For Utility Types:**

```typescript
import type { QueryResult, PerformanceMetrics } from '@/lib/types/database'
```

---

## 🏗️ Current State & Recommended Changes

### **Current Issues:**

1. **Duplication:** `types/database.ts` may be a copy of `utils/supabase/database.types.ts`
2. **Inconsistent imports:** Some files use `@/types/database`, others use `@/utils/supabase/database.types`
3. **Stub file:** `types/supabase.ts` contains minimal stub types (should be removed)

### **Recommended Structure:**

```
web/
├── utils/supabase/
│   └── database.types.ts          # Generated (DO NOT EDIT)
├── types/
│   ├── database.ts                # Re-export: export * from '@/utils/supabase/database.types'
│   ├── profile.ts                 # Custom profile types
│   ├── poll.ts                    # Custom poll types
│   └── index.ts                   # Centralized exports
└── lib/types/
    └── database.ts                # Utility/operational types
```

---

## 📝 Best Practices

### **1. When Adding New Types:**

- **Database schema changes:** Regenerate `utils/supabase/database.types.ts`, never edit manually
- **Application types:** Add to `types/` directory in appropriate file
- **Feature-specific types:** Add to `types/features/[feature-name]/`
- **Utility types:** Add to `lib/types/` if related to infrastructure/operations

### **2. When Importing Types:**

- **Database schema:** Use `@/types/database` (convenience) or `@/utils/supabase/database.types` (explicit)
- **Application types:** Use `@/types/[filename]` or `@/types` (barrel export)
- **Utility types:** Use `@/lib/types/[filename]`

### **3. Type Regeneration Workflow:**

```bash
# 1. Make schema changes in Supabase (migrations)
# 2. Regenerate types
cd /Users/alaughingkitsune/src/Choices
supabase gen types typescript --linked > web/utils/supabase/database.types.ts

# 3. Verify types compile
cd web
npm run type-check

# 4. Update any application types that extend database types if needed
```

---

## 🔧 Migration Plan

To unify the type system:

1. **Ensure `types/database.ts` re-exports from generated types:**
   ```typescript
   // web/types/database.ts
   export * from '@/utils/supabase/database.types'
   export type { Database } from '@/utils/supabase/database.types'
   ```

2. **Remove stub file:** Delete `types/supabase.ts` (if it's not needed)

3. **Update inconsistent imports:** Standardize on `@/types/database` for schema types

4. **Document the pattern:** This file serves as the guide

---

## ❓ FAQ

**Q: Where do I import `Database` type from?**  
A: Use `@/types/database` - it re-exports from the generated types.

**Q: Can I edit `utils/supabase/database.types.ts`?**  
A: No - it's auto-generated. Your changes will be lost on next regeneration.

**Q: Where do I add types for a new feature?**  
A: Create `types/features/[feature-name]/index.ts` and export from `types/index.ts`.

**Q: What's the difference between `lib/types/database.ts` and `types/database.ts`?**  
A: `lib/types/database.ts` = utility/operational types. `types/database.ts` = schema types.

---

**Last Updated:** January 26, 2025


