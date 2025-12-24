# Production Testing

This document describes the production testing infrastructure for the Choices application.

## Overview

Production tests verify that the deployed application at `https://choices-app.com` is working correctly. These tests run against the actual live site to catch deployment issues, configuration problems, and regressions that might not appear in local or CI environments.

## Test Suites

### 1. Production Smoke Tests (`production-smoke.spec.ts`)

Critical functionality tests that verify:
- **Critical Pages**: Root redirect, feed page, auth page, dashboard access
- **API Endpoints**: Health checks, feeds API, civics API, site messages
- **Security Headers**: CSP, X-Frame-Options, HTTPS enforcement
- **Error Handling**: 404 pages, invalid endpoints
- **Performance**: Page load times
- **Accessibility**: HTML structure, semantic elements

### 2. Production Critical Journeys (`production-critical-journeys.spec.ts`)

End-to-end user journey tests that verify:
- Root page redirects to feed correctly
- Feed page loads without hydration errors (React error #185)
- Navigation between pages works
- API health checks respond correctly
- Middleware redirects work
- Error handling is graceful

### 3. Production E2E Tests

Full end-to-end tests using real credentials:
- **Auth Production** (`auth-production.spec.ts`): User and admin authentication
- **Poll Production** (`poll-production.spec.ts`): Poll creation and sharing

## Running Production Tests

### Automated (CI/CD)

Production tests run automatically:
- **On schedule**: Every 6 hours via cron
- **On push to main**: When production test files change
- **On demand**: Via `workflow_dispatch` in GitHub Actions

### Manual Execution

To run production tests locally:

```bash
cd web

# Run smoke tests against production
BASE_URL=https://choices-app.com npx playwright test production-smoke.spec.ts

# Run critical journeys
BASE_URL=https://choices-app.com npx playwright test production-critical-journeys.spec.ts

# Run all production tests
BASE_URL=https://choices-app.com PRODUCTION_URL=https://choices-app.com npx playwright test production-*.spec.ts auth-production.spec.ts poll-production.spec.ts
```

### Testing Against Local Server

To test against a local server instead:

```bash
BASE_URL=http://127.0.0.1:3000 npx playwright test production-smoke.spec.ts
```

## Test Configuration

### Environment Variables

- `BASE_URL`: The base URL to test against (default: `https://choices-app.com`)
- `PRODUCTION_URL`: Explicit production URL (default: `https://choices-app.com`)
- `E2E_USER_EMAIL`: Test user email (for E2E tests)
- `E2E_USER_PASSWORD`: Test user password (for E2E tests)
- `E2E_ADMIN_EMAIL`: Admin user email (for E2E tests)
- `E2E_ADMIN_PASSWORD`: Admin user password (for E2E tests)
- `PLAYWRIGHT_USE_MOCKS`: Set to `'0'` to use real backend (default: `'1'`)

### GitHub Actions Workflow

The production tests workflow (`.github/workflows/production-tests.yml`) includes:

1. **Production Smoke Tests**: Fast smoke tests for critical functionality
2. **Production E2E Tests**: Full end-to-end tests with authentication
3. **Production API Tests**: API endpoint verification
4. **Test Summary**: Aggregated results and status checks

## What Gets Tested

### Critical Fixes Verified

1. **Root Redirect**: `/` correctly redirects to `/feed` via middleware
2. **Feed Page Loading**: Feed page loads without React hydration errors
3. **Error Handling**: 500 errors are caught and handled gracefully
4. **API Health**: All health endpoints respond correctly
5. **Security Headers**: Security headers are present and correct

### Continuous Monitoring

Production tests serve as continuous monitoring:
- Detect deployment failures immediately
- Catch configuration issues
- Verify fixes are working in production
- Monitor performance regressions
- Ensure security headers are present

## Test Results

Test results are available:
- **GitHub Actions**: Workflow run artifacts
- **PR Comments**: Automatic comments on pull requests
- **Status Checks**: Commit status checks for production test results

## Best Practices

1. **Run after deployments**: Always run production tests after deploying to production
2. **Monitor regularly**: Check test results from scheduled runs
3. **Fix failures immediately**: Production test failures indicate real issues
4. **Update tests with features**: Add tests for new critical features
5. **Keep credentials secure**: Use GitHub Secrets for test credentials

## Troubleshooting

### Tests Fail After Deployment

1. Check Vercel deployment logs for build/runtime errors
2. Verify environment variables are set correctly
3. Check if the deployment actually completed
4. Verify the production URL is accessible

### Intermittent Failures

1. Check for rate limiting (tests may hit rate limits)
2. Verify network connectivity
3. Check if external services (Supabase, etc.) are available
4. Review test timeouts - may need adjustment

### Authentication Tests Fail

1. Verify test credentials are correct in GitHub Secrets
2. Check if test accounts exist in production database
3. Verify Supabase configuration is correct
4. Check for account lockouts or restrictions

## Future Enhancements

- [ ] Add performance benchmarking
- [ ] Add visual regression testing
- [ ] Add load testing against production
- [ ] Add monitoring/alerting integration
- [ ] Add test result dashboards

