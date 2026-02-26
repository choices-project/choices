# Troubleshooting Guide

_Last updated: January 2026_

This guide covers common issues and solutions when working with the Choices platform.

## Development Setup Issues

### Node.js Version Mismatch

**Problem:** `npm install` fails or version errors appear.

**Solution:**
```bash
# Check your Node version
node --version  # Should be 24.11.0 or higher

# Use Volta (recommended) or nvm to switch versions
volta install node@24.11.0
# or
nvm install 24.11.0
nvm use 24.11.0
```

### npm Version Mismatch

**Problem:** Package manager version errors.

**Solution:**
```bash
# Check npm version
npm --version  # Should be 11.6.1 or higher

# Update npm
npm install -g npm@11.6.1
```

### Supabase Types Not Generating

**Problem:** `npm run types:generate` fails or types are outdated.

**Solution:**
```bash
# Ensure Supabase CLI is installed
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-id>

# Generate types
cd web
npm run types:generate
```

**If linking fails:**
- Verify your Supabase project ID
- Check your Supabase CLI authentication: `supabase login`
- Ensure you have access to the project

### Environment Variables Missing

**Problem:** App crashes or shows errors about missing environment variables.

**Solution:**
1. Create `web/.env.local` if it doesn't exist
2. Copy required variables from [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md)
3. At minimum, set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

### Build Fails with TypeScript Errors

**Problem:** `npm run build` fails with TypeScript errors.

**Solution:**
```bash
# Check for type errors
npm run type-check

# Regenerate Supabase types if schema changed
npm run types:generate

# Clear Next.js cache
rm -rf .next
npm run build
```

## Runtime Issues

### Hydration Errors

**Problem:** React hydration mismatches in console.

**Solution:**
- Check for components using browser-only APIs during SSR
- Ensure dynamic imports use `ssr: false` for client-only components
- Verify `suppressHydrationWarning` is set correctly on root elements
- See [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for SSR patterns

### Database Connection Errors

**Problem:** API routes fail with database connection errors.

**Solution:**
1. Verify Supabase credentials in `.env.local`
2. Check Supabase project status
3. Verify network connectivity
4. Check Supabase service status

```bash
# Test connection
curl https://your-project.supabase.co/rest/v1/
```

### Authentication Not Working

**Problem:** Users can't log in or sessions expire unexpectedly.

**Solution:**
1. Check Supabase Auth settings
2. Verify cookie settings in production
3. Check CORS configuration
4. Verify `NEXT_PUBLIC_BASE_URL` matches your domain

### Rate Limiting Issues

**Problem:** Getting 429 errors or rate limit warnings.

**Solution:**
- Check rate limit configuration in `lib/rate-limiting/`
- Verify Upstash Redis connection
- Review rate limit headers in responses
- Consider implementing request queuing for high-volume operations

## Testing Issues

### Tests Fail Locally But Pass in CI

**Problem:** Tests pass in CI but fail locally.

**Solution:**
1. Clear test cache: `rm -rf node_modules/.cache`
2. Ensure environment variables match CI
3. Run tests in CI mode: `npm run jest:ci`
4. Check for timezone issues (CI uses UTC)

### Playwright Tests Timeout

**Problem:** E2E tests timeout or fail to start.

**Solution:**
```bash
# Ensure dev server is running
npm run dev

# Run with explicit config
npx playwright test --config=playwright.config.ts

# Check for port conflicts
lsof -i :3000
```

### Mock Service Worker Not Working

**Problem:** MSW handlers not intercepting requests.

**Solution:**
1. Verify MSW is initialized in test setup
2. Check handler registration order
3. Ensure handlers match request URLs exactly
4. Clear MSW cache: `rm -rf node_modules/.msw`

## API Issues

### API Returns 500 Errors

**Problem:** API endpoints return internal server errors.

**Solution:**
1. Check server logs (Sentry or console)
2. Verify database connection
3. Check environment variables
4. Review error responses for details
5. Test with `curl` or Postman to isolate client issues

### API Response Format Errors

**Problem:** Client code fails to parse API responses.

**Solution:**
1. Verify response format matches [`API/contracts.md`](API/contracts.md)
2. Check for middleware modifying responses
3. Verify error handling in API routes
4. Test with contract tests: `npm run test:contracts`

### CORS Errors

**Problem:** Browser shows CORS errors when calling API.

**Solution:**
1. Check `NEXT_PUBLIC_BASE_URL` matches request origin
2. Verify CORS configuration in middleware
3. Check origin validation in `lib/http/origin`
4. Ensure API routes use proper CORS headers

## State Management Issues

### Store State Not Persisting

**Problem:** Zustand store state resets on page reload.

**Solution:**
1. Verify `persist` middleware is configured
2. Check `partialize` includes required fields
3. Verify storage is available (not SSR)
4. Check browser storage permissions

### Store Selectors Causing Re-renders

**Problem:** Components re-render unnecessarily.

**Solution:**
1. Use memoized selectors: `useMemo` for action hooks
2. Use `useShallow` for multiple selections
3. Verify selectors are stable references
4. Check for `useStore(state => state)` anti-patterns

See [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) for patterns.

## Build and Deployment Issues

### Build Fails on Vercel

**Problem:** Deployment fails during build.

**Solution:**
1. Check build logs for specific errors
2. Verify environment variables are set in Vercel
3. Ensure Node.js version matches (24.11.0)
4. Check for memory/timeout issues
5. Review `vercel.json` configuration

### Production Build Different from Dev

**Problem:** App works in dev but not in production.

**Solution:**
1. Test production build locally: `npm run build && npm run start`
2. Check for environment-specific code
3. Verify all environment variables are set
4. Check for client-only code running on server
5. Review Next.js build output for warnings

## Feature-Specific Issues

### Feed and Feedback Issues

See [`docs/archive/reference/troubleshooting-feed-and-feedback-2025.md`](archive/reference/troubleshooting-feed-and-feedback-2025.md) for historical feed and feedback troubleshooting.

### Push Notification Issues

See [`docs/archive/reference/push-notifications/push-notifications-testing-2025.md`](archive/reference/push-notifications/push-notifications-testing-2025.md) and [`docs/archive/reference/push-notifications/push-notifications-vapid-setup-2025.md`](archive/reference/push-notifications/push-notifications-vapid-setup-2025.md) for historical push notification troubleshooting.

### Analytics Dashboard Issues

**Problem:** Analytics widgets not loading or showing errors.

**Solution:**
1. Check Redis connection (Upstash)
2. Verify analytics endpoints are accessible
3. Check browser console for errors
4. Verify user has analytics permissions
5. Check widget store state: `/e2e/widget-store` harness

## Getting More Help

### Check Documentation

1. [`docs/README.md`](README.md) - Documentation index
2. [`docs/GETTING_STARTED.md`](GETTING_STARTED.md) - Development setup
3. [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) - System architecture
4. [`docs/TESTING.md`](TESTING.md) - Testing guide

### Debug Tools

**Development:**
- Browser DevTools console
- React DevTools
- Next.js build output
- Supabase dashboard logs

**Production:**
- Sentry error tracking
- Vercel deployment logs
- Supabase logs
- Upstash Redis metrics

### Create an Issue

If you can't resolve the issue:

1. Search existing issues
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
   - Relevant logs/errors

### Security Issues

**Do not create public issues for security vulnerabilities.** See [`SECURITY.md`](SECURITY.md) for private reporting.

---

**Still stuck?** Check the [documentation index](README.md) or create an issue on GitHub.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

