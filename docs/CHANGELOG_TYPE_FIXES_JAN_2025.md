# Type Fixes and API Updates - January 2025

**Date:** January 29, 2025  
**Status:** ✅ Completed  
**Purpose:** Documentation of recent TypeScript fixes and API updates

---

## 📋 **Summary**

This document outlines the TypeScript fixes and API updates made in January 2025 to improve type safety, fix compilation errors, and update deprecated patterns.

---

## 🔧 **Major Changes**

### **1. Supabase Client API Updates**

**Previous Pattern (Deprecated):**
```typescript
import { createClient } from '@/utils/supabase/client'
import { getSupabaseClient } from '@/utils/supabase/client'

const supabase = createClient()
// or
const supabase = getSupabaseClient()
```

**New Pattern (Current):**
```typescript
// Client-side
import { getSupabaseBrowserClient } from '@/utils/supabase/client'
const supabase = await getSupabaseBrowserClient()

// Server-side
import { getSupabaseServerClient } from '@/utils/supabase/server'
const supabase = await getSupabaseServerClient()
```

**Files Updated:**
- `web/features/feeds/lib/hashtag-polls-integration-client.ts`
- `web/features/feeds/lib/interest-based-feed.ts`
- `web/features/hashtags/lib/hashtag-moderation.ts`
- `web/lib/stores/adminStore.ts`
- `web/lib/stores/performanceStore.ts`
- `web/features/pwa/lib/PWAAnalytics.ts`

**See:** [Supabase Client Usage Guide](docs/DEVELOPER_GUIDE_SUPABASE_CLIENT.md)

---

### **2. Type System Fixes**

#### **TranslatedText Parameter Types**
- **Issue:** `params` could include numbers, but `t()` function expected only strings
- **Fix:** Added automatic conversion of number values to strings
- **File:** `web/components/shared/TranslatedText.tsx`

#### **WebAuthn ArrayBuffer Types**
- **Issue:** `ArrayBufferLike` type incompatibility
- **Fix:** Added type assertions (`as ArrayBuffer`)
- **Files:**
  - `web/features/auth/lib/webauthn/native/server.ts`
  - `web/features/auth/lib/webauthn/type-converters.ts`

#### **ProcessEnv NODE_ENV Duplicate Declarations**
- **Issue:** Duplicate `NODE_ENV` declarations in global namespace
- **Fix:** Removed duplicate declarations (already defined in global Node.js types)
- **Files:**
  - `web/features/analytics/lib/AnalyticsEngine.ts`
  - `web/features/civics/lib/types/civics-types.ts`

---

### **3. Import Path Corrections**

#### **withOptional Import**
- **Previous:** `import { withOptional } from '@/lib/utils/optional'`
- **Current:** `import { withOptional } from '@/lib/util/objects'`
- **File:** `web/features/polls/pages/analytics/page.tsx`

---

### **4. Feature Flag Updates**

#### **Removed Non-Existent Feature Flags**
- **Issue:** Code referenced `FEATURE_FLAGS.DEMOGRAPHIC_FILTERING` which doesn't exist
- **Fix:** Removed conditional checks, always enabled the functionality
- **File:** `web/features/feeds/lib/interest-based-feed.ts`

---

### **5. Rate Limiting Implementation**

#### **Auth Middleware Rate Limiting**
- **Issue:** Missing `rateLimiters` object
- **Fix:** Implemented rate limiting using `apiRateLimiter.checkLimit()` with configuration map
- **File:** `web/lib/core/auth/middleware.ts`

**Rate Limit Configurations:**
- `auth`: 10 requests per 15 minutes
- `registration`: 5 requests per hour
- `deviceFlow`: 3 requests per hour
- `biometric`: 20 requests per 15 minutes

---

### **6. Syntax Fixes**

#### **Import Statement Corrections**
- **File:** `web/app/(app)/profile/edit/page.tsx`
- **Fix:** Corrected `import Gray { Badge }` to `import { Badge }`

---

## 📚 **Documentation Updates**

### **New Documentation Files**
1. **[Developer Guide: Supabase Client Usage](docs/DEVELOPER_GUIDE_SUPABASE_CLIENT.md)**
   - Comprehensive guide for using Supabase clients correctly
   - Migration guide from old patterns
   - Common patterns and mistakes to avoid

### **Updated Documentation Files**
1. **[Onboarding Guide](docs/ONBOARDING.md)**
   - Added reference to Supabase Client Usage Guide
   - Updated code standards section

2. **[Rate Limiting Guide](docs/UPSTASH_RATE_LIMITING.md)**
   - Added information about auth middleware rate limiting
   - Updated last updated date

3. **[Authentication Guide](docs/implementation/features/AUTHENTICATION.md)**
   - Updated last updated date

---

## ✅ **Testing Status**

- **TypeScript Compilation:** ✅ Fixed all errors
- **Build Process:** ✅ Completing successfully
- **E2E Tests:** 🔄 In progress (build blockers resolved)

---

## 🔄 **Migration Checklist**

For developers updating existing code:

- [ ] Replace `createClient()` with `getSupabaseBrowserClient()` or `getSupabaseServerClient()`
- [ ] Replace `getSupabaseClient()` with appropriate client function
- [ ] Add `await` to all Supabase client calls (they now return Promises)
- [ ] Update imports from `@/lib/utils/optional` to `@/lib/util/objects`
- [ ] Remove references to `FEATURE_FLAGS.DEMOGRAPHIC_FILTERING`
- [ ] Update rate limiting code to use `apiRateLimiter.checkLimit()`

---

## 📖 **Related Documentation**

- [Supabase Client Usage Guide](docs/DEVELOPER_GUIDE_SUPABASE_CLIENT.md)
- [Rate Limiting Guide](docs/UPSTASH_RATE_LIMITING.md)
- [Onboarding Guide](docs/ONBOARDING.md)
- [Authentication Guide](docs/implementation/features/AUTHENTICATION.md)

---

**Last Updated:** January 29, 2025  
**Status:** ✅ Completed

