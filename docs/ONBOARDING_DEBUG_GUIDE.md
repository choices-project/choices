# IA/PO Onboarding Redirect Debug Guide

**Last Updated:** August 27, 2025  
**Status:** ✅ **RESOLVED** - Cross-browser redirect issues fixed

## Problem Summary

The IA/PO (Identity Authentication/Progressive Onboarding) system had cross-browser redirect issues where the registration → onboarding → dashboard flow worked inconsistently across different browsers.

## Root Cause Analysis

The core issue was **relying on client-side navigation** instead of **server-driven redirects**. This caused:
- Timing races between client-side fetch and navigation
- Browser-specific differences in handling redirects
- Form submission inconsistencies across browsers

## Solution Implemented ✅

### 1. Native HTML Forms with Server-Driven Redirects

**Registration Page (`/register`):**
```typescript
<form method="POST" action="/api/auth/register-ia" noValidate>
  <input name="username" maxLength={20} required />
  <input name="email" type="email" required />
  <button type="submit">Create account</button>
</form>
```

**Onboarding Completion (`/onboarding`):**
```typescript
<form method="POST" action="/api/user/complete-onboarding" noValidate>
  <button type="submit">Get Started</button>
</form>
```

### 2. Server-Side API Redirects

**Registration API (`/api/auth/register-ia`):**
```typescript
// Handle both form data and JSON requests
const formData = await req.formData()
const username = String(formData.get('username') || '')

// Create user and session
const sessionToken = jwt.sign({...}, process.env.JWT_SECRET!)

// Return 303 redirect with session cookie
const response = NextResponse.redirect(new URL('/onboarding', req.url), { status: 303 })
setSessionTokenInResponse(sessionToken, response)
return response
```

**Onboarding Completion API (`/api/user/complete-onboarding`):**
```typescript
// Mark user as onboarded
await supabase.from('user_profiles').update({
  onboarding_completed: true,
  updated_at: new Date().toISOString()
}).eq('user_id', stableId)

// Return 303 redirect to dashboard
const response = NextResponse.redirect(new URL('/dashboard', req.url), { status: 303 })
setSessionTokenInResponse(updatedSessionToken, response)
return response
```

### 3. Server-Side Guards

**Dashboard Page (`/dashboard`):**
```typescript
export default async function DashboardPage() {
  const user = await getUserFromCookies()
  
  if (!user) {
    redirect('/login')
  }

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  return <Dashboard user={user} />
}
```

## Key Improvements

1. **✅ Eliminated Client-Side Navigation Races**: No more `fetch()` + manual redirects
2. **✅ Cross-Browser Compatibility**: Native forms work consistently across all browsers
3. **✅ Server-Side Security**: Authentication checks happen before page render
4. **✅ Simplified Architecture**: Removed complex browser detection and navigation utilities
5. **✅ Proper Session Management**: Session cookies set correctly in API responses

## Test Results ✅

**Chromium:** ✅ Registration → Onboarding → Dashboard works perfectly  
**Firefox:** ✅ Registration → Onboarding → Dashboard works perfectly  
**WebKit:** ✅ Registration → Onboarding → Dashboard works perfectly  
**Mobile Chrome:** ✅ Registration → Onboarding → Dashboard works perfectly  
**Mobile Safari:** ✅ Registration → Onboarding → Dashboard works perfectly  

## Technical Details

### Database Schema Fixes
- Fixed `ia_users` table insert to match actual schema
- Removed non-existent `user_id` column
- Added required fields: `verification_tier`, `is_active`, etc.
- Provided default email when none is provided

### Session Management
- Session cookies properly set in API responses
- Cache control headers prevent caching issues
- JWT tokens include proper user information
- Server-side session validation

### Form Handling
- Support for both form data and JSON requests
- Proper validation and error handling
- Unique email generation for parallel tests
- Proper redirect handling with `Promise.all()`

## Files Modified

1. **`web/app/register/page.tsx`** - Simplified to native HTML form
2. **`web/app/api/auth/register-ia/route.ts`** - Server-driven redirects
3. **`web/app/onboarding/page.tsx`** - Native form for completion
4. **`web/app/api/user/complete-onboarding/route.ts`** - Server-driven redirects
5. **`web/app/dashboard/page.tsx`** - Server-side guards
6. **`web/tests/e2e/ia-po-simple-flow.test.ts`** - Updated test suite

## Best Practices Implemented

1. **Server-Driven Redirects**: Use `303 See Other` for form submissions
2. **Native HTML Forms**: Leverage browser's built-in form handling
3. **Server-Side Guards**: Authentication checks before page render
4. **Proper Error Handling**: Comprehensive validation and error responses
5. **Cross-Browser Testing**: Verified functionality across all major browsers

## Conclusion

The cross-browser redirect issues have been **completely resolved** through the implementation of server-driven redirects with native HTML forms. The registration → onboarding → dashboard flow now works reliably across all browsers, providing a consistent and secure user experience.

**Next Steps:**
- Continue monitoring for any edge cases
- Consider implementing additional security measures
- Expand test coverage for edge cases
- Document the solution for future reference
