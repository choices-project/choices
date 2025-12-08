# Quick Start - Choices App E2E Testing

## ✅ Setup Complete

Your E2E test suite for `choices-app.com` is ready to use! Environment variables are automatically loaded from `.env.local`.

## Quick Commands

### Run All Tests
```bash
npm run test:e2e:choices-app
```

### Run Specific Test Suites
```bash
# Authentication tests (login, logout, session)
npm run test:e2e:choices-app:auth

# Session & cookie management
npm run test:e2e:choices-app:session

# Dashboard functionality
npm run test:e2e:choices-app:dashboard

# Complete user journeys
npm run test:e2e:choices-app:journey
```

### Debug Mode
```bash
# Interactive UI mode
npm run test:e2e:choices-app:ui

# Headed browser (see what's happening)
npm run test:e2e:choices-app:headed
```

## Test Coverage

### Authentication Tests (7 tests × 2 browsers = 14 total)
- ✅ Successful login with valid credentials
- ✅ Session persistence across page navigations
- ✅ API authentication after login
- ✅ Invalid credentials handling
- ✅ Logout and session clearing
- ✅ Session persistence after page refresh
- ✅ Admin user access to admin routes

### Session & Cookie Tests
- ✅ Secure cookie settings in production
- ✅ Session persistence in new browser contexts
- ✅ API request authentication with cookies
- ✅ Cross-tab session sharing
- ✅ Cookie expiration handling
- ✅ SameSite cookie attributes

### Dashboard Tests
- ✅ Dashboard loads successfully
- ✅ Dashboard data API calls
- ✅ User-specific content display
- ✅ API error handling
- ✅ Feed refresh functionality
- ✅ Site messages loading

### User Journey Tests
- ✅ Complete login to dashboard journey
- ✅ Navigation flow after login
- ✅ Session persistence during navigation
- ✅ Error recovery after failed API calls
- ✅ Multiple rapid page navigations

## What Gets Tested

The tests verify:
1. **Authentication Flow** - Can users log in successfully?
2. **Session Persistence** - Do sessions persist across navigations?
3. **Cookie Security** - Are cookies set with proper security flags?
4. **API Authentication** - Do API calls work after login?
5. **Error Handling** - How does the app handle failures?
6. **User Journeys** - Do complete workflows function end-to-end?

## Monitoring michaeltempesta@gmail.com Issues

These tests are specifically designed to catch the authentication issues experienced by users like `michaeltempesta@gmail.com`:

- ✅ Verifies cookies are set correctly after login
- ✅ Confirms API calls succeed (not 401 errors)
- ✅ Validates session persistence across page loads
- ✅ Tests cookie security settings in production

## Viewing Results

After running tests, view the HTML report:
```bash
npx playwright show-report playwright-report-choices-app
```

## Troubleshooting

If tests fail:
1. Check that `.env.local` has valid credentials
2. Verify `choices-app.com` is accessible
3. Run in headed mode to see what's happening: `npm run test:e2e:choices-app:headed`
4. Check the HTML report for screenshots/videos of failures

## Next Steps

1. **Run a quick test** to verify everything works:
   ```bash
   npm run test:e2e:choices-app:auth -- --grep "should successfully log in"
   ```

2. **Schedule regular runs** - Add to CI/CD for continuous monitoring

3. **Monitor results** - Track test success rates over time

4. **Expand coverage** - Add more test scenarios as needed

