# Smart Redirect System

## Overview

The smart redirect system intelligently routes users to the appropriate destination after authentication based on their onboarding status and context.

## How It Works

### 1. Authentication Flow
When users authenticate (via magic link, OAuth, or email/password), the system:

1. **Checks if the user has a profile** in the `user_profiles` table
2. **Redirects new users to `/onboarding`** if they don't have a profile yet
3. **Redirects returning users to `/dashboard`** if they have completed onboarding
4. **Respects explicit redirect requests** if the user was trying to access a specific page
5. **Falls back gracefully** to `/dashboard` if there are any errors

### 2. Redirect Logic

```typescript
async function getRedirectDestination(supabase, user, requestedRedirect) {
  // If user explicitly requested a specific redirect, respect it
  if (requestedRedirect && requestedRedirect !== '/dashboard') {
    return requestedRedirect
  }

  // Check if user has completed onboarding (has a profile)
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  // If no profile exists, user needs to complete onboarding
  if (!profile) {
    return '/onboarding'
  }

  // User has completed onboarding, go to dashboard
  return '/dashboard'
}
```

## Implementation Details

### Files Modified

1. **`web/app/auth/callback/route.ts`**
   - Added `getRedirectDestination()` helper function
   - Updated authentication callback to use smart redirect logic
   - Added comprehensive error handling and logging

2. **`web/app/login/page.tsx`**
   - Changed default `redirectTo` from `/dashboard` to `/`
   - Allows auth callback to decide the final destination

3. **`web/app/register/page.tsx`**
   - Changed default `redirectTo` from `/dashboard` to `/`
   - Allows auth callback to decide the final destination

### User Experience

#### New Users
- **Sign up** → Email verification → **Onboarding flow**
- **Magic link login** → **Onboarding flow** (if no profile)
- **OAuth login** → **Onboarding flow** (if no profile)

#### Returning Users
- **Login** → **Dashboard** (if profile exists)
- **Magic link** → **Dashboard** (if profile exists)
- **OAuth** → **Dashboard** (if profile exists)

#### Specific Page Access
- **Direct link to `/polls`** → **Respects redirect** to `/polls`
- **Direct link to `/analytics`** → **Respects redirect** to `/analytics`

## Testing

The system has been tested with the following scenarios:

✅ **New user (no profile)** → Redirects to `/onboarding`
✅ **Explicit redirect request** → Respects the requested destination
✅ **Returning user (with profile)** → Redirects to `/dashboard`
✅ **Error handling** → Falls back to `/dashboard` on errors

## Benefits

1. **Better User Experience**: New users are guided through onboarding instead of seeing an empty dashboard
2. **Contextual Routing**: Users are sent to where they were trying to go
3. **Graceful Degradation**: System handles errors gracefully
4. **Consistent Behavior**: All authentication methods use the same logic
5. **Future-Proof**: Easy to extend for additional user states or destinations

## Future Enhancements

- **Role-based redirects**: Different destinations for admins, contributors, etc.
- **Feature flags**: Redirect based on enabled features
- **Analytics tracking**: Track user flow through the redirect system
- **A/B testing**: Test different onboarding flows
