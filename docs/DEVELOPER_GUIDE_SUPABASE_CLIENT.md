# Supabase Client Usage Guide

**Created:** January 29, 2025  
**Last Updated:** November 3, 2025  
**Status:** ✅ Current (Verified - pattern still used)  
**Purpose:** Guide for using Supabase clients correctly in the Choices platform

---

## 🎯 **Overview**

The Choices platform uses separate Supabase client functions for client-side and server-side code to ensure proper SSR support and type safety. This guide explains when and how to use each function.

---

## 🔑 **Client Functions**

### **Client-Side: `getSupabaseBrowserClient()`**

Use this function in:
- React components with `'use client'` directive
- Client-side utilities and hooks
- Browser-only code

**Location:** `@/utils/supabase/client`

**Usage:**
```typescript
import { getSupabaseBrowserClient } from '@/utils/supabase/client'

// In a client component
'use client'

export default function MyComponent() {
  const fetchData = async () => {
    const supabase = await getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .limit(10)
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    // Use data...
  }
  
  // ...
}
```

**Important Notes:**
- Must be used with `await` (returns a Promise)
- Will throw an error if used in server-side code
- Automatically handles browser session cookies

---

### **Server-Side: `getSupabaseServerClient()`**

Use this function in:
- API routes (`app/api/**/route.ts`)
- Server Components
- Server Actions
- Middleware

**Location:** `@/utils/supabase/server`

**Usage:**
```typescript
import { getSupabaseServerClient } from '@/utils/supabase/server'

// In an API route
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
```

**Important Notes:**
- Must be used with `await` (returns a Promise)
- Automatically reads cookies for authentication
- Uses SSR-safe implementation

---

### **Admin Operations: `getSupabaseAdminClient()`**

Use this function ONLY for:
- Admin operations that bypass RLS
- Server-side admin tasks
- Initial setup scripts

**Location:** `@/utils/supabase/server`

**Usage:**
```typescript
import { getSupabaseAdminClient } from '@/utils/supabase/server'

// In an admin API route (with proper authentication checks)
export async function POST(request: NextRequest) {
  // Always verify admin access first!
  const isAdmin = await verifyAdminAccess(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const supabase = await getSupabaseAdminClient()
  
  // Now you can bypass RLS for admin operations
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ trust_tier: 'T3' })
    .eq('user_id', userId)
  
  // ...
}
```

**⚠️ Security Warning:**
- NEVER expose admin client to client-side code
- Always verify admin access before using
- Use RLS policies instead when possible

---

## 🔄 **Migration Guide**

### **Old Pattern (Deprecated)**
```typescript
// ❌ DON'T USE - Deprecated
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()

// ❌ DON'T USE - Deprecated
import { getSupabaseClient } from '@/utils/supabase/client'
const supabase = getSupabaseClient()
```

### **New Pattern (Current)**
```typescript
// ✅ Client-side
import { getSupabaseBrowserClient } from '@/utils/supabase/client'
const supabase = await getSupabaseBrowserClient()

// ✅ Server-side
import { getSupabaseServerClient } from '@/utils/supabase/server'
const supabase = await getSupabaseServerClient()
```

---

## 📋 **Decision Tree**

```
Is this code running in the browser?
├─ YES → Use `getSupabaseBrowserClient()` from `@/utils/supabase/client`
│
└─ NO → Is this an admin operation that needs to bypass RLS?
    ├─ YES → Use `getSupabaseAdminClient()` from `@/utils/supabase/server`
    │        (with proper admin authentication checks)
    │
    └─ NO → Use `getSupabaseServerClient()` from `@/utils/supabase/server`
```

---

## 🔧 **Common Patterns**

### **In Zustand Stores (Client-Side)**
```typescript
import { getSupabaseBrowserClient } from '@/utils/supabase/client'

export const useMyStore = create((set) => ({
  loadData: async () => {
    const supabase = await getSupabaseBrowserClient()
    const { data } = await supabase.from('table').select('*')
    set({ data })
  }
}))
```

### **In API Routes (Server-Side)**
```typescript
import { getSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  // ...
}
```

### **In Server Actions**
```typescript
'use server'

import { getSupabaseServerClient } from '@/utils/supabase/server'

export async function myServerAction() {
  const supabase = await getSupabaseServerClient()
  // ...
}
```

---

## ⚠️ **Common Mistakes to Avoid**

1. **❌ Using browser client in server code**
   ```typescript
   // DON'T DO THIS
   import { getSupabaseBrowserClient } from '@/utils/supabase/client'
   export async function GET() { // This is server-side!
     const supabase = await getSupabaseBrowserClient() // Will throw error
   }
   ```

2. **❌ Forgetting to await**
   ```typescript
   // DON'T DO THIS
   const supabase = getSupabaseBrowserClient() // Returns Promise!
   ```

3. **❌ Using admin client without verification**
   ```typescript
   // DON'T DO THIS
   export async function POST() {
     const supabase = await getSupabaseAdminClient() // No admin check!
     // Security risk!
   }
   ```

---

## 🔍 **Type Safety**

All client functions return typed Supabase clients with full TypeScript support:

```typescript
import { getSupabaseBrowserClient } from '@/utils/supabase/client'
import type { Database } from '@/utils/supabase/database.types'

const supabase = await getSupabaseBrowserClient()
// supabase is typed as SupabaseClient<Database>
// Full autocomplete and type checking available
```

### **Regenerating Types**

When database schema changes, regenerate TypeScript types:

```bash
cd web
npm run types:generate
```

Types are automatically generated from the linked Supabase project using Supabase CLI v2.54.11+.

---

## 📚 **Related Documentation**

- [Authentication Guide](docs/implementation/features/AUTHENTICATION.md)
- [Onboarding Guide](docs/ONBOARDING.md)
- [Rate Limiting Guide](docs/UPSTASH_RATE_LIMITING.md)

---

**Last Updated:** January 29, 2025  
**Status:** ✅ Current and Active

