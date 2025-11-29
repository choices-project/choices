# Choices App E2E Testing Guide

This document describes the comprehensive E2E testing suite for `choices-app.com` (production environment).

## Overview

The choices-app.com E2E test suite provides extensive coverage of:
- **Authentication flows** - Login, logout, session management
- **Session persistence** - Cookie management, cross-tab sessions, API authentication
- **Dashboard functionality** - Data loading, API calls, error handling
- **Complete user journeys** - End-to-end workflows from login to feature usage

## Configuration

### Environment Variables

Set these environment variables before running tests:

```bash
# Required for authentication tests
export E2E_USER_EMAIL="your-test-user@example.com"
export E2E_USER_PASSWORD="your-test-password"

# Optional: Admin tests
export E2E_ADMIN_EMAIL="admin@example.com"
export E2E_ADMIN_PASSWORD="admin-password"

# Alternative variable names (also supported)
export CHOICES_APP_TEST_EMAIL="your-test-user@example.com"
export CHOICES_APP_TEST_PASSWORD="your-test-password"
export CHOICES_APP_ADMIN_EMAIL="admin@example.com"
export CHOICES_APP_ADMIN_PASSWORD="admin-password"
```

### Test Credentials

**Important**: Use dedicated test accounts, not production user accounts. These tests will:
- Log in and out repeatedly
- Navigate through the application
- Make API calls
- Test error scenarios

## Running Tests

### All Tests

Run the complete test suite against choices-app.com:

```bash
npm run test:e2e:choices-app
```

### Individual Test Suites

Run specific test suites:

```bash
# Authentication tests only
npm run test:e2e:choices-app:auth

# Session and cookie management tests
npm run test:e2e:choices-app:session

# Dashboard functionality tests
npm run test:e2e:choices-app:dashboard

# Complete user journey tests
npm run test:e2e:choices-app:journey
```

### Interactive Testing

Run tests with UI for debugging:

```bash
# Playwright UI mode
npm run test:e2e:choices-app:ui

# Headed browser mode
npm run test:e2e:choices-app:headed
```

## Test Suites

### 1. Authentication Tests (`choices-app-auth.spec.ts`)

Tests authentication flows:
- ✅ Successful login with valid credentials
- ✅ Session persistence across page navigations
- ✅ API authentication after login
- ✅ Invalid credentials handling
- ✅ Logout functionality
- ✅ Session persistence after page refresh
- ✅ Admin user access to admin routes

### 2. Session & Cookie Management (`choices-app-session.spec.ts`)

Tests session and cookie handling:
- ✅ Secure cookie settings in production
- ✅ Session persistence in new browser contexts
- ✅ API request authentication with cookies
- ✅ Cross-tab session sharing
- ✅ Cookie expiration handling
- ✅ SameSite cookie attributes

### 3. Dashboard Functionality (`choices-app-dashboard.spec.ts`)

Tests dashboard features:
- ✅ Dashboard loads successfully
- ✅ Dashboard data API calls
- ✅ User-specific content display
- ✅ API error handling
- ✅ Feed refresh functionality
- ✅ Site messages loading

### 4. User Journey Tests (`choices-app-user-journey.spec.ts`)

End-to-end user workflows:
- ✅ Complete login to dashboard journey
- ✅ Navigation flow after login
- ✅ Session persistence during navigation
- ✅ Error recovery after failed API calls
- ✅ Multiple rapid page navigations

## Test Configuration

The test configuration (`playwright.choices-app.config.ts`) includes:
- **Base URL**: `https://choices-app.com`
- **Timeout**: 90 seconds (longer for production network conditions)
- **Retries**: 2 retries in CI, 1 locally
- **Browsers**: Chromium and Firefox (WebKit optional)
- **Reporting**: HTML and JUnit reports

## Monitoring Test Results

### HTML Reports

After running tests, view the HTML report:

```bash
npx playwright show-report playwright-report-choices-app
```

### CI Integration

The tests are designed to run in CI/CD pipelines. They:
- Generate JUnit XML reports for CI integration
- Include screenshots and videos on failure
- Have appropriate timeouts for production environments

## Troubleshooting

### Common Issues

1. **Tests fail with "Test credentials not configured"**
   - Ensure environment variables are set
   - Check that credentials are valid

2. **401 Unauthorized errors**
   - Verify test user account is active
   - Check that cookies are being set correctly
   - Review authentication flow in browser DevTools

3. **Timeouts**
   - Production network conditions may be slower
   - Increase timeout in config if needed
   - Check if choices-app.com is accessible

4. **Cookie issues**
   - Verify HTTPS is working (cookies require secure in production)
   - Check browser console for cookie warnings
   - Ensure SameSite attributes are correct

### Debugging Tips

1. **Run in headed mode** to see what's happening:
   ```bash
   npm run test:e2e:choices-app:headed
   ```

2. **Use Playwright UI** for step-by-step debugging:
   ```bash
   npm run test:e2e:choices-app:ui
   ```

3. **Check browser console** - Tests capture console errors

4. **Review network requests** - Tests monitor API calls and their status codes

5. **View screenshots/videos** - Automatically captured on failure

## Best Practices

1. **Use dedicated test accounts** - Don't use production user accounts
2. **Run tests during off-peak hours** - Reduce impact on production
3. **Monitor test duration** - Long-running tests may indicate issues
4. **Review failures carefully** - They may indicate real production issues
5. **Keep credentials secure** - Use environment variables, never commit credentials

## Continuous Monitoring

These tests can be integrated into:
- **Scheduled CI runs** - Daily/weekly production health checks
- **Pre-deployment checks** - Verify production before releases
- **Alerting systems** - Notify on test failures
- **Monitoring dashboards** - Track test success rates over time

## Related Documentation

- [Main E2E Testing README](./README.md)
- [Playwright Configuration](../playwright.config.ts)
- [E2E Helpers](./helpers/e2e-setup.ts)

