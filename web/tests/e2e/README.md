# E2E Test Suite Documentation

This directory contains end-to-end (E2E) tests for the Choices application using Playwright.

## Test Organization

Tests are organized by feature area in the `specs/` directory:

```
specs/
  auth/                    # Authentication-related tests
    - auth-flow.spec.ts     # Comprehensive authentication flow tests
    - auth-production.spec.ts  # Production authentication tests
    - auth-access.spec.ts   # Authentication access control tests
  production/              # Production environment tests
    - production-smoke.spec.ts  # Quick smoke tests for critical functionality
    - production-critical-journeys.spec.ts  # Critical user journey tests
    - production-expanded.spec.ts  # Expanded production test coverage
  dashboard/               # Dashboard-related tests
    - dashboard-feeds.spec.ts
    - dashboard-journey.spec.ts
    - dashboard-auth.spec.ts
  ...                      # Other feature-specific test files
```

## Authentication Requirements

### Authentication-First Redirect Behavior

The application implements an authentication-first redirect policy:

- **Unauthenticated users** visiting `/` are redirected to `/auth` for login/signup
- **Authenticated users** visiting `/` are redirected to `/feed`
- Protected routes (e.g., `/feed`, `/dashboard`) redirect unauthenticated users to `/auth`

This behavior is implemented in `web/middleware.ts` using Supabase authentication checks.

### Test Authentication

Most E2E tests require authentication. Use the helper functions from `helpers/auth-helpers.ts`:

```typescript
import { ensureAuthenticated, ensureUnauthenticated } from '../helpers/auth-helpers';

test('my test', async ({ page }) => {
  // Ensure logged out
  await ensureUnauthenticated(page);
  
  // Or ensure logged in
  await ensureAuthenticated(page, {
    email: process.env.E2E_USER_EMAIL!,
    password: process.env.E2E_USER_PASSWORD!,
  });
});
```

## Test Helpers

### Authentication Helpers (`helpers/auth-helpers.ts`)

- `ensureAuthenticated(page, credentials)` - Log in a user
- `ensureUnauthenticated(page)` - Clear authentication state
- `checkAuthRedirect(page, expectedPath)` - Verify redirect behavior
- `waitForAuthentication(page, timeout)` - Wait for auth to complete
- `isAuthenticated(page)` - Check if user is authenticated

### E2E Setup Helpers (`helpers/e2e-setup.ts`)

- `loginTestUser(page, credentials)` - Login helper for tests
- `loginAsAdmin(page, credentials)` - Admin login helper
- `ensureLoggedOut(page)` - Ensure user is logged out
- `waitForPageReady(page)` - Wait for page to be fully loaded
- `setupExternalAPIMocks(page)` - Setup API mocks for tests

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/specs/auth/auth-flow.spec.ts

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

### Production Tests

Production tests run against the live production site (`https://choices-app.com`):

```bash
# Run production smoke tests
BASE_URL=https://choices-app.com npx playwright test tests/e2e/specs/production/production-smoke.spec.ts

# Run with authentication
BASE_URL=https://choices-app.com \
  E2E_USER_EMAIL=your-email@example.com \
  E2E_USER_PASSWORD=your-password \
  npx playwright test tests/e2e/specs/production/production-smoke.spec.ts
```

## Environment Variables

### Required for Production Tests

- `BASE_URL` - Base URL for the application (default: `https://choices-app.com`)
- `PRODUCTION_URL` - Production URL (default: `https://choices-app.com`)

### Required for Authenticated Tests

- `E2E_USER_EMAIL` - Test user email
- `E2E_USER_PASSWORD` - Test user password
- `E2E_ADMIN_EMAIL` - Admin user email (for admin tests)
- `E2E_ADMIN_PASSWORD` - Admin user password (for admin tests)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

### Test Configuration

- `PLAYWRIGHT_USE_MOCKS` - Set to `'0'` to disable mocks and use real backend
- `NEXT_PUBLIC_ENABLE_E2E_HARNESS` - Enable E2E test harness routes

## Test Structure

### Test File Naming

- `*.spec.ts` - Playwright test files
- Feature-based naming: `{feature}-{aspect}.spec.ts`
- Example: `auth-flow.spec.ts`, `dashboard-feeds.spec.ts`

### Test Organization

Each test file should:

1. Import necessary helpers and fixtures
2. Set up test context (authentication, mocks, etc.)
3. Group related tests using `test.describe()`
4. Use descriptive test names
5. Include appropriate timeouts for CI environments

### Example Test Structure

```typescript
import { expect, test } from '@playwright/test';
import { ensureUnauthenticated } from '../helpers/auth-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await ensureUnauthenticated(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` branch
- Pull requests
- Scheduled runs (production tests every 6 hours)

### Test Workflows

- `.github/workflows/test.yml` - Main test workflow
- `.github/workflows/production-tests.yml` - Production environment tests

## Debugging Tests

### View Test Reports

```bash
# Generate and view HTML report
npx playwright show-report
```

### Debug Mode

  ```bash
# Run in debug mode
npm run test:e2e:debug

# Or use Playwright inspector
PWDEBUG=1 npx playwright test
```

### Common Issues

1. **Timeout errors**: Increase timeout in test or use `test.setTimeout()`
2. **Authentication failures**: Verify credentials in environment variables
3. **Flaky tests**: Add appropriate waits and retries
4. **Mock issues**: Check `PLAYWRIGHT_USE_MOCKS` environment variable

## React Controlled Inputs

### Important: Form Input Handling

**React controlled inputs require special handling in E2E tests.** The application uses React controlled inputs where form state is managed by React, not the DOM.

#### ❌ Don't Use `fill()`

```typescript
// WRONG - This doesn't trigger React's onChange handlers
await emailInput.fill('test@example.com');
await passwordInput.fill('password123');
// Button will stay disabled because React state doesn't update
```

#### ✅ Use `pressSequentially()`

```typescript
// CORRECT - This properly triggers React's onChange handlers
await emailInput.click();
await emailInput.pressSequentially('test@example.com', { delay: 20 });
await passwordInput.click();
await passwordInput.pressSequentially('password123', { delay: 20 });
await page.waitForTimeout(300); // Wait for React to process state updates
```

#### Why This Matters

React controlled inputs use `value={formData.email}` and `onChange={(e) => setFormData({...formData, email: e.target.value})}`. The form validation checks `formData.email` and `formData.password`, not the input DOM values. If React state doesn't update, the submit button stays disabled.

#### Helper Functions

The `loginTestUser()` helper in `helpers/e2e-setup.ts` handles this correctly. Always use helper functions when available:

```typescript
import { loginTestUser } from '../helpers/e2e-setup';

await loginTestUser(page, {
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser'
});
```

#### Manual Form Filling

If you need to fill forms manually, follow this pattern:

```typescript
// 1. Wait for form to be ready
await page.waitForSelector('[data-testid="auth-hydrated"]', { timeout: 10_000 });

// 2. Clear and focus inputs
await emailInput.click();
await emailInput.clear();
await passwordInput.click();
await passwordInput.clear();

// 3. Use pressSequentially (not fill)
await emailInput.pressSequentially('test@example.com', { delay: 20 });
await passwordInput.pressSequentially('password123', { delay: 20 });

// 4. Wait for React to process state updates
await page.waitForTimeout(300);

// 5. Verify inputs have correct values
await page.waitForFunction(
  ({ expectedEmail, expectedPassword }) => {
    const emailInput = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
    return emailInput?.value === expectedEmail && passwordInput?.value === expectedPassword;
  },
  { expectedEmail: 'test@example.com', expectedPassword: 'password123' },
  { timeout: 5_000 }
);

// 5. Check for validation indicators (optional)
if (email.includes('@')) {
  await page.waitForSelector('[data-testid="email-validation"]', { 
    state: 'visible', 
    timeout: 2_000 
  }).catch(() => {});
}

// 6. Wait for button to be enabled
const submitButton = page.getByTestId('login-submit');
await expect(submitButton).toBeEnabled({ timeout: 10_000 });
```

## Best Practices

1. **Always clear authentication state** in `beforeEach` when testing auth flows
2. **Use descriptive test names** that explain what is being tested
3. **Add appropriate timeouts** for CI environments (60s+ for auth operations)
4. **Test both authenticated and unauthenticated flows** where applicable
5. **Use helper functions** instead of duplicating code
6. **Mock external APIs** in development, use real APIs in production tests
7. **Document authentication requirements** in test file comments
8. **Always use `pressSequentially()` for React controlled inputs** - never use `fill()`
9. **Wait for React state updates** after filling form inputs
10. **Verify form validation** by checking for validation indicators or button state

## Maintenance

- Keep test files organized by feature
- Update this README when adding new test categories
- Review and update production tests when authentication behavior changes
- Ensure all tests pass before merging to main
