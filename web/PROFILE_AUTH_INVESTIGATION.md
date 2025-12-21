# Profile Authentication Investigation Results

## Test Results Summary

### Cookie Inspection Test Results (Latest Deployment)
- **Cookie IS being set**: `sb-muqwrehywjrbaeerjgfb-auth-token` exists after login ✅
- **Cookie attributes** (Still incorrect after initial fixes):
  - `httpOnly: false` ❌ (should be `true` for security) - **FIXED in latest code**
  - `secure: false` ❌ (should be `true` in production) - **FIXED in latest code**
  - `domain: www.choices-app.com` ⚠️ (explicitly set - may cause issues) - **FIXED in latest code**
  - `sameSite: Lax` ✅ (correct)
  - `path: /` ✅ (correct)

### Profile Page Test Results (Latest Deployment)
- **Status**: ❌ Still redirecting to `/auth?redirectTo=/profile`
- **Current URL after login**: `/feed` ✅ (login works)
- **Final URL after profile navigation**: `/auth?redirectTo=/profile` ❌ (middleware redirect)
- **Root cause**: Cookie attributes are still wrong, preventing middleware from reading them correctly

## Root Cause Analysis

### Issue 1: Cookie Attributes
The cookie is being set by Supabase SSR through our cookie adapter, but:
1. `httpOnly` is not being set to `true` - Supabase SSR may not be passing this in options
2. `secure` is not being set to `true` - Should be `true` in production
3. `domain` is explicitly set to `www.choices-app.com` - This may prevent cookie from being read in certain scenarios

### Issue 2: Middleware Cookie Detection
The middleware should be able to detect the cookie (`sb-muqwrehywjrbaeerjgfb-auth-token`), but it's not. Possible reasons:
1. Cookie domain mismatch (if middleware runs on different domain)
2. Cookie not being sent with the request (httpOnly/secure issues)
3. Middleware cookie reading logic issue

## Current Cookie Flow

1. **Login API Route** (`/api/auth/login`):
   - Uses `getSupabaseApiRouteClient()` which creates a Supabase client with cookie adapter
   - Cookie adapter uses `NextResponse.cookies.set()` to set cookies
   - Supabase SSR calls `cookieAdapter.set()` when `signInWithPassword()` succeeds
   - Cookie is set: `sb-muqwrehywjrbaeerjgfb-auth-token`

2. **Middleware** (`middleware.ts`):
   - Checks for cookies matching pattern `sb-<project-ref>-auth-token`
   - Should detect: `sb-muqwrehywjrbaeerjgfb-auth-token`
   - Currently: Not detecting the cookie (redirects to `/auth`)

## Fixes Applied (Latest)

### Fix 1: Force Cookie Attributes for Auth Cookies ✅
**File**: `web/utils/supabase/api-route.ts`

When Supabase SSR sets cookies through our adapter, we now FORCE correct attributes for auth cookies:

```typescript
// For auth cookies, FORCE secure values regardless of what Supabase SSR passes
const isAuthCookie = name.includes('auth') || name.includes('session') || name.startsWith('sb-')

const cookieOptions = {
  // Force secure values for auth cookies
  httpOnly: isAuthCookie ? true : (typeof options.httpOnly === 'boolean' ? options.httpOnly : undefined),
  secure: isAuthCookie ? requireSecure : (typeof options.secure === 'boolean' ? options.secure : undefined),
  sameSite: (typeof options.sameSite === 'string' ? options.sameSite : 'lax') as 'strict' | 'lax' | 'none',
  path: typeof options.path === 'string' ? options.path : '/',
}
```

**Key change**: We now FORCE `httpOnly: true` and `secure: true` for auth cookies, even if Supabase SSR passes `false`.

### Fix 2: Force Cookie Attributes When Copying ✅
**File**: `web/app/api/auth/login/route.ts`

When copying cookies to final response, we now force correct attributes:

```typescript
allCookies.forEach((cookie) => {
  const isAuthCookie = cookie.name.includes('auth') || cookie.name.includes('session') || cookie.name.startsWith('sb-')
  
  // Force secure values for auth cookies
  finalResponse.cookies.set(cookie.name, cookie.value, {
    httpOnly: isAuthCookie ? true : (cookie.httpOnly ?? undefined),
    secure: isAuthCookie ? requireSecure : (cookie.secure ?? undefined),
    // ... other options
  })
})
```

### Fix 3: Enhanced Logging ✅
**Files**: 
- `web/utils/supabase/api-route.ts` - Logs cookie setting with options received
- `web/app/api/auth/login/route.ts` - Logs cookie copying with original vs final attributes
- `web/utils/supabase/middleware.ts` - Enhanced debugging for cookie inspection

### Fix 4: Remove Domain Attribute ✅
The cookie should NOT have an explicit domain attribute. Let the browser handle domain scoping:

```typescript
// Don't set domain attribute - browser will handle it
response.cookies.set(name, value, cookieOptions)
// IMPORTANT: Do NOT set domain attribute - let browser handle domain scoping
```

## Next Steps

1. ✅ **Fix cookie attributes** - Force `httpOnly: true` and `secure: true` for auth cookies
2. ✅ **Remove domain attribute** - Let browser handle domain scoping
3. ✅ **Add middleware debugging** - Enhanced logging for cookie inspection
4. ✅ **Force attributes when copying** - Ensure cookies maintain security attributes
5. ⏳ **Test after deployment** - Verify cookies now have correct attributes
6. ⏳ **Verify middleware detects cookies** - Confirm middleware can read authentication
7. ⏳ **Verify profile page loads** - Confirm no redirect to `/auth`

## Latest Changes (Committed, Awaiting Deployment)

### Cookie Adapter Fixes
- **Force `httpOnly: true`** for all auth cookies (regardless of Supabase SSR options)
- **Force `secure: true`** in production for all auth cookies
- **Enhanced logging** to track what options Supabase SSR passes vs what we set

### Login Route Fixes
- **Force attributes when copying** cookies to final response
- **Enhanced logging** to track original vs final cookie attributes
- **Better error handling** for cookie operations

### Expected Results After Next Deployment
- Cookies should have `httpOnly: true` and `secure: true` in production
- Cookies should NOT have explicit domain attribute
- Middleware should be able to read cookies correctly
- Profile page should load without redirect to `/auth`

## Test Commands

```bash
# Run cookie inspection test
BASE_URL=https://www.choices-app.com E2E_USER_EMAIL=anonysendlol@gmail.com E2E_USER_PASSWORD=ujg-hqp3MGU9tqf1jyv PLAYWRIGHT_USE_MOCKS=0 npx playwright test tests/e2e/specs/production/production-cookie-inspection.spec.ts --config=tests/e2e/playwright.config.ts

# Run profile deep diagnostic
BASE_URL=https://www.choices-app.com E2E_USER_EMAIL=anonysendlol@gmail.com E2E_USER_PASSWORD=ujg-hqp3MGU9tqf1jyv PLAYWRIGHT_USE_MOCKS=0 npx playwright test tests/e2e/specs/production/production-profile-deep-diagnostic.spec.ts --config=tests/e2e/playwright.config.ts
```

