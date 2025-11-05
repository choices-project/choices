# Supabase Client Utilities

**⚠️ IMPORTANT: Database Types Location ⚠️**

## 🚫 DO NOT Create Database Types Here

Database types are **ONLY** stored in:
```
web/types/supabase.ts
```

**This directory (`utils/supabase/`) contains**:
- `client.ts` - Browser client initialization
- `server.ts` - Server client initialization  
- `middleware.ts` - Middleware client (if exists)

**This directory does NOT contain**:
- ❌ `database.types.ts` (DELETED - was duplicate)
- ❌ Any Database type definitions

## ✅ To Import Database Types

```typescript
import type { Database } from '@/types/supabase'
```

**NOT from this directory.**

---

See `/web/types/README.md` for complete database types documentation.
