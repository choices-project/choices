# E2E Test Authentication - Definitive Guide

**Last Updated**: November 6, 2025  
**Status**: ✅ Current and Accurate

## Core Principle

**All E2E tests use REAL authentication - no mocks, no bypasses, no shortcuts.**

This ensures our tests validate the actual user experience and security flows.

---

## How Authentication Works

### 1. Test Users

We use **real Supabase users** that exist in the database:

| User | Email | Role | Purpose |
|------|-------|------|---------|
| Admin | `michaeltempesta@gmail.com` | Admin | Test admin features |
| Regular | `anonysendlol@gmail.com` | User | Test regular features |

**Credentials**: Stored in `.env.test.local` (gitignored, secure)

### 2. Authentication Flow

```typescript
import { loginAsAdmin } from './helpers/e2e-setup';

test('admin feature', async ({ page }) => {
  // 1. Navigate to auth page
  await page.goto('/auth');
  
  // 2. Login with real credentials
  await loginAsAdmin(page);
  
  // 3. Supabase creates session + cookies
  // 4. User is now authenticated
  
  // 5. Navigate to protected route
  await page.goto('/admin/analytics');
  
  // 6. Test the feature
  await expect(page.locator('h1')).toContainText('Analytics');
});
```

### 3. Session Management

- **Cookies**: Supabase sets auth cookies automatically
- **LocalStorage**: Session tokens stored in browser
- **Server-Side**: Middleware validates on each request
- **No Bypasses**: E2E tests go through full auth stack

---

## Authentication Functions

### `loginAsAdmin(page)`

Logs in as admin user with full privileges.

```typescript
import { loginAsAdmin } from './helpers/e2e-setup';

test('admin dashboard', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin');
  // User is authenticated as admin
});
```

### `loginTestUser(page, user)`

Logs in as any test user.

```typescript
import { loginTestUser } from './helpers/e2e-setup';

test('user profile', async ({ page }) => {
  await loginTestUser(page, {
    email: 'anonysendlol@gmail.com',
    password: process.env.E2E_USER_PASSWORD!,
    username: 'testuser'
  });
  await page.goto('/profile');
  // User is authenticated
});
```

### `registerTestUser(page, user)`

Registers a new test user (for registration flow tests).

```typescript
import { registerTestUser } from './helpers/e2e-setup';

test('registration flow', async ({ page }) => {
  await registerTestUser(page, {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!@#',
    username: 'newuser'
  });
  // User is registered and authenticated
});
```

---

## What Gets Tested

### ✅ Real Authentication
- Supabase auth API calls
- Session creation and management
- Cookie handling
- Token validation
- Logout flows

### ✅ Access Control
- Admin-only routes (middleware checks)
- User-specific data (RLS policies)
- Permission-based features
- Unauthenticated access handling

### ✅ Security
- Password validation
- CSRF protection
- Session expiry
- Secure cookie flags

### ❌ NOT Tested (Not Real)
- Mock authentication
- Bypassed security checks
- Fake session tokens
- Hardcoded auth states

---

## Environment Variables

Required in `.env.test.local`:

```bash
# Supabase connection (your dev/test project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test user credentials
E2E_ADMIN_EMAIL=michaeltempesta@gmail.com
E2E_ADMIN_PASSWORD=<secure-password>
E2E_USER_EMAIL=anonysendlol@gmail.com  
E2E_USER_PASSWORD=<secure-password>
```

**Security**: `.env.test.local` is in `.gitignore` - passwords never committed.

---

## Common Patterns

### Testing Protected Routes

```typescript
test('protected feature', async ({ page }) => {
  // Login first
  await loginAsAdmin(page);
  
  // Navigate to protected route
  await page.goto('/admin/users');
  
  // Middleware validates auth, allows access
  await expect(page).toHaveURL('/admin/users');
  await expect(page.locator('h1')).toContainText('User Management');
});
```

### Testing Access Denial

```typescript
test('blocks non-admin users', async ({ page }) => {
  // Don't login (or login as regular user)
  await page.goto('/admin/analytics');
  
  // Should redirect or show access denied
  await expect(page.locator('text=/Access Denied|Unauthorized/i')).toBeVisible();
});
```

### Testing Logout

```typescript
test('logout flow', async ({ page }) => {
  await loginAsAdmin(page);
  
  // User is authenticated
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard');
  
  // Logout
  await page.click('[data-testid="logout-button"]');
  
  // Session cleared, redirected to login
  await expect(page).toHaveURL('/auth');
  
  // Can't access protected routes
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/auth');
});
```

---

## Implementation Details

### Login Flow (Under the Hood)

When you call `loginAsAdmin(page)`:

1. **Navigate**: Goes to `/auth` page
2. **Wait for Hydration**: Ensures React components loaded
3. **Fill Form**: Enters email and password
4. **Submit**: Clicks submit button
5. **Supabase Auth**: Real API call to Supabase
6. **Session Created**: Cookies and tokens set
7. **Verification**: Checks for auth cookies/tokens
8. **Ready**: Test continues with authenticated session

### What Middleware Does

Every request goes through `middleware.ts`:

1. **Extract Session**: Read auth cookies
2. **Validate Token**: Verify with Supabase
3. **Check Permissions**: Verify user role for route
4. **Allow/Deny**: Continue or redirect

E2E tests validate this entire flow works correctly.

---

## User Creation

Test users are created automatically before tests run.

### Global Setup

`tests/e2e/setup/global-setup.ts` runs before all tests:

```typescript
// 1. Load environment variables
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

// 2. Connect to Supabase with service role key
const supabase = createClient(url, serviceKey);

// 3. Check if user exists
const existing = await supabase.auth.admin.listUsers();

// 4. Create if doesn't exist
if (!exists) {
  await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });
}

// 5. Update profile with admin flag
await supabase
  .from('user_profiles')
  .upsert({ user_id, is_admin: true });
```

### Manual User Creation

If needed, run:

```bash
npm run test:e2e:setup
```

This creates/updates test users using the service role key.

---

## Security Best Practices

### ✅ DO

- Use strong passwords (16+ chars, complexity required)
- Store credentials in `.env.test.local` only
- Use separate test Supabase project (not production)
- Validate all auth flows end-to-end
- Test both success and failure cases
- Keep service role key secure

### ❌ DON'T

- Hardcode passwords in tests
- Commit `.env.test.local` to git
- Use production credentials in tests
- Mock authentication in E2E tests
- Bypass security checks for "convenience"
- Share passwords in plain text

---

## Troubleshooting

### "User not authenticated"

**Cause**: Login failed or session not created  
**Fix**:
1. Verify credentials in `.env.test.local`
2. Check user exists: `npm run test:e2e:verify`
3. Check Supabase connection settings
4. View test screenshots in `test-results/`

### "Access Denied" for Admin

**Cause**: User doesn't have admin flag  
**Fix**:
```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'michaeltempesta@gmail.com';
```

### Login Hangs/Times Out

**Cause**: Auth page not loading or React not hydrating  
**Fix**:
1. Check dev server is running
2. Increase timeouts in test
3. Check for console errors in test screenshots
4. Verify `/auth` page works manually

### Session Not Persisting

**Cause**: Cookies not being set/sent  
**Fix**:
1. Verify Supabase URL is correct
2. Check cookie domain settings
3. Ensure not blocking third-party cookies in test browser

---

## Examples

### Complete Admin Test

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForPageReady } from './helpers/e2e-setup';

test.describe('Admin Analytics', () => {
  test('should display analytics dashboard', async ({ page }) => {
    // Authenticate as admin
    await loginAsAdmin(page);
    
    // Navigate to admin-only route
    await page.goto('/admin/analytics');
    await waitForPageReady(page);
    
    // Verify we have access
    await expect(page).toHaveURL('/admin/analytics');
    await expect(page.locator('h1')).toContainText('Analytics');
    
    // Test admin-only features
    await expect(page.locator('[data-testid="admin-controls"]')).toBeVisible();
  });
});
```

### Testing Registration

```typescript
test('user registration flow', async ({ page }) => {
  const newUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecureTestPass123!@#',
    username: 'newuser'
  };
  
  // Register new user (creates real account)
  await registerTestUser(page, newUser);
  
  // Should be logged in and redirected
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
  
  // Can access user features
  await page.goto('/profile');
  await expect(page.locator('[data-testid="user-email"]'))
    .toContainText(newUser.email);
});
```

---

## Architecture

```
E2E Test
   ↓
loginAsAdmin()
   ↓
Navigate to /auth
   ↓
Fill credentials
   ↓
Submit form
   ↓
Supabase Auth API
   ↓
Session + Cookies
   ↓
Navigate to /admin/analytics
   ↓
middleware.ts validates session
   ↓
Route renders (or denies access)
   ↓
Test assertions
```

**Every step is real.** No mocks, no bypasses.

---

## Summary

✅ **Real Authentication**: All tests use actual Supabase auth  
✅ **Real Users**: Test users exist in database  
✅ **Real Sessions**: Cookies and tokens work like production  
✅ **Real Security**: Middleware and RLS policies validated  
✅ **Secure Credentials**: Passwords never committed  

This approach ensures our E2E tests validate the actual user experience and catch real security issues.

---

## Related Files

- `helpers/e2e-setup.ts` - Authentication helper functions
- `helpers/test-admin-users.ts` - User configuration
- `setup/create-test-users.ts` - User creation logic
- `setup/global-setup.ts` - Pre-test setup
- `TEST_USERS.md` - User credentials documentation
- `QUICK_START.md` - Quick reference guide

---

**Questions?** See `TEST_USERS.md` for user setup or `README.md` for general testing guide.

