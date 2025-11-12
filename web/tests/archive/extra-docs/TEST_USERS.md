# E2E Test Users

**Last Updated**: November 6, 2025

## Test Users (Already Exist)

✅ **Admin User**
- **Email**: `michaeltempesta@gmail.com`
- **Role**: Admin
- **Password**: Set in `.env.test.local`

✅ **Regular User**
- **Email**: `anonysendlol@gmail.com`
- **Role**: Regular user
- **Password**: Set in `.env.test.local`

**These users exist in the database. Just run tests:**

```bash
npm run test:e2e
```

## Configuration

Environment variables in `.env.test.local`:

```bash
E2E_ADMIN_EMAIL=michaeltempesta@gmail.com
E2E_ADMIN_PASSWORD=<already-set>

E2E_USER_EMAIL=anonysendlol@gmail.com
E2E_USER_PASSWORD=<already-set>
```

✅ Already configured - no changes needed!

## How Authentication Works

1. **Setup runs automatically** before tests
2. **Tests call** `loginAsAdmin(page)` or `loginTestUser(page, user)`
3. **Real Supabase authentication** - no mocks, no bypasses
4. **Session created** with cookies and tokens

## Usage in Tests

```typescript
import { loginAsAdmin } from './helpers/e2e-setup';

test('admin feature', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/analytics');
  // Now authenticated as michaeltempesta@gmail.com
});
```

## Related Files

- `QUICK_START.md` - Quick reference
- `AUTHENTICATION.md` - Complete auth guide
- `helpers/e2e-setup.ts` - Authentication functions

