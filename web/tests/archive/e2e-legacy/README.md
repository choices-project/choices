# E2E Testing Guide

**Last Updated**: November 6, 2025

---

## Quick Start

```bash
npm run test:e2e
```

Everything is configured and ready!

---

## Test Users

✅ **Admin**: `michaeltempesta@gmail.com`  
✅ **Regular**: `anonysendlol@gmail.com`

Passwords in `.env.test.local` - already configured.

---

## Authentication

All tests use **real Supabase authentication**:

```typescript
import { loginAsAdmin } from './helpers/e2e-setup';

test('admin feature', async ({ page }) => {
  await loginAsAdmin(page);  // Uses michaeltempesta@gmail.com
  await page.goto('/admin/analytics');
  // Test with real session
});
```

**No mocks, no bypasses** - tests validate actual user experience.

---

## Test IDs

Use `data-testid` for reliable selectors:

```typescript
// Auth page
await page.fill('[data-testid="login-email"]', email);
await page.fill('[data-testid="login-password"]', password);
await page.click('[data-testid="login-submit"]');

// Feedback widget
await page.click('[data-testid="feedback-widget-button"]');

// Admin
await expect(page.locator('[data-testid="admin-access-denied"]')).not.toBeVisible();
```

**Complete reference**: See test ID list in codebase (grep for `data-testid=`)

---

## Writing Tests

### Basic Pattern
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForPageReady } from './helpers/e2e-setup';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);  // If admin-only
  });

  test('should do something', async ({ page }) => {
    await page.goto('/my-feature');
    await waitForPageReady(page);
    
    await expect(page.locator('[data-testid="my-element"]')).toBeVisible();
  });
});
```

---

## Test Categories

### E2E Tests (32 files)
- **Analytics** (3 tests) - Admin & user analytics
- **Authentication** (2 tests) - Login, register, flows
- **Candidate** (1 test) - Candidate features
- **Civics** (7 tests) - Representative lookup, voting records
- **Database** (1 test) - Performance & health
- **Feedback** (1 test) - Feedback widget
- **Location** (1 test) - Location features
- **Polls** (2 tests) - Poll management, hashtags
- **Privacy** (4 tests) - Data deletion, export, settings
- **PWA** (6 tests) - Installation, offline, notifications
- **Representatives** (1 test) - Rep communication
- **User Flows** (2 tests) - Journeys, unified feed
- **Widgets** (1 test) - Widget dashboard

---

## Common Commands

```bash
# Run all tests
npm run test:e2e

# Run specific file
npx playwright test tests/e2e/analytics.spec.ts

# Interactive mode (best for debugging)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed
```

---

## Troubleshooting

### "User not authenticated"
- Credentials are in `.env.test.local` - should work automatically
- Run: `npm run test:e2e:verify` to check admin access

### "Element not found"
- Check element has `data-testid` attribute
- Check test ID matches actual component
- See screenshots in `test-results/` for debugging

### Tests timeout
- Heavy pages (analytics) may need longer timeouts
- Use `waitUntil: 'commit'` instead of `'domcontentloaded'`
- Add `timeout: 60000` to page.goto()

---

## Setup Scripts

These run automatically, but you can run manually:

```bash
npm run test:e2e:check    # Check environment
npm run test:e2e:verify   # Verify admin access
npm run test:e2e:setup    # Setup/update users
```

---

## Security

✅ **Real authentication** - No bypasses in production code  
✅ **Separate database** - Test against dev/test instance  
✅ **Secure credentials** - In `.env.test.local` (gitignored)  
✅ **Strong passwords** - All meet security requirements

---

## Additional Info

**Test ID Reference**: Grep for `data-testid=` in codebase (291 total)  
**Archived Docs**: See `../archive/` for historical documentation  
**Test Status**: See `../TEST_STATUS.md` for current results

---

**Status**: ✅ Ready to use  
**Setup Required**: None - already configured  
**Pass Rate**: ~30-40% (improving)
