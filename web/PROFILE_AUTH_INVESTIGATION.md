# Profile Authentication Investigation Results

## Test Results Summary

### Cookie Inspection Test Results
- **Cookie IS being set**: `sb-muqwrehywjrbaeerjgfb-auth-token` exists after login
- **Cookie attributes**:
  - `httpOnly: false` ❌ (should be `true` for security)
  - `secure: false` ❌ (should be `true` in production)
  - `domain: www.choices-app.com` ⚠️ (explicitly set - may cause issues)
  - `sameSite: Lax` ✅ (correct)
  - `path: /` ✅ (correct)

### Profile Page Test Results
- **Status**: ❌ Still redirecting to `/auth?redirectTo=/profile`
- **Current URL after login**: `/feed` ✅ (login works)
- **Final URL after profile navigation**: `/auth?redirectTo=/profile` ❌ (middleware redirect)

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

## Recommended Fixes

### Fix 1: Ensure Cookie Attributes Are Correct
When Supabase SSR sets cookies through our adapter, we should ensure proper attributes:

```typescript
// In web/utils/supabase/api-route.ts cookieAdapter.set()
const cookieOptions: {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
  maxAge?: number
} = {
  // Default to secure values if not provided
  httpOnly: typeof options.httpOnly === 'boolean' ? options.httpOnly : true,
  secure: typeof options.secure === 'boolean' ? options.secure : (process.env.NODE_ENV === 'production'),
  sameSite: (typeof options.sameSite === 'string' ? options.sameSite : 'lax') as 'strict' | 'lax' | 'none',
  path: typeof options.path === 'string' ? options.path : '/',
}

if (typeof options.maxAge === 'number') {
  cookieOptions.maxAge = options.maxAge
}
```

### Fix 2: Remove Domain Attribute
The cookie should NOT have an explicit domain attribute. Let the browser handle domain scoping:

```typescript
// Don't set domain attribute - browser will handle it
response.cookies.set(name, value, cookieOptions)
// NOT: response.cookies.set(name, value, { ...cookieOptions, domain: 'www.choices-app.com' })
```

### Fix 3: Add Middleware Debugging
Add logging to middleware to see what cookies it's actually receiving:

```typescript
// In web/utils/supabase/middleware.ts
if (process.env.DEBUG_MIDDLEWARE === '1') {
  const allCookies = request.cookies.getAll()
  console.log('[Middleware] All cookies:', allCookies.map(c => c.name))
  console.log('[Middleware] Looking for:', `sb-${projectRef}-auth-token`)
}
```

## Next Steps

1. ✅ **Fix cookie attributes** - Ensure `httpOnly: true` and `secure: true` in production
2. ✅ **Remove domain attribute** - Let browser handle domain scoping
3. ✅ **Add middleware debugging** - Log what cookies middleware sees
4. ⏳ **Test after deployment** - Verify middleware can now detect cookies
5. ⏳ **Verify profile page loads** - Confirm no redirect to `/auth`

## Test Commands

```bash
# Run cookie inspection test
BASE_URL=https://www.choices-app.com E2E_USER_EMAIL=anonysendlol@gmail.com E2E_USER_PASSWORD=ujg-hqp3MGU9tqf1jyv PLAYWRIGHT_USE_MOCKS=0 npx playwright test tests/e2e/specs/production/production-cookie-inspection.spec.ts --config=tests/e2e/playwright.config.ts

# Run profile deep diagnostic
BASE_URL=https://www.choices-app.com E2E_USER_EMAIL=anonysendlol@gmail.com E2E_USER_PASSWORD=ujg-hqp3MGU9tqf1jyv PLAYWRIGHT_USE_MOCKS=0 npx playwright test tests/e2e/specs/production/production-profile-deep-diagnostic.spec.ts --config=tests/e2e/playwright.config.ts
```

