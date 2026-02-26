# Production Testing Guide

**Last Updated**: December 2025 (React controlled input handling in E2E tests)

## Overview

Production testing validates the actual user experience in the live environment. Unlike unit or integration tests that run in isolation, production tests run against the deployed application to catch real-world issues.

## Philosophy

**Tests reveal issues → We fix the code → Better UX/UI**

- ✅ **Good**: Test fails → Fix code → Test passes → Better user experience
- ❌ **Bad**: Test fails → Weaken test → Test passes → Users still experience issues

## Test Categories

### 1. Performance Metrics (Core Web Vitals)

**What we test:**
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1
- First Contentful Paint (FCP) < 1.8s
- Time to First Byte (TTFB) < 600ms

**Why it matters:**
- Google uses these metrics for search rankings
- Users perceive slow sites as broken
- Poor performance = lost users

**Files:**
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Performance Metrics section)

### 2. Accessibility Excellence

**What we test:**
- Keyboard navigation works throughout the app
- Screen reader announcements for dynamic content
- Form inputs have proper labels and error messages
- ARIA attributes are correct
- Focus indicators are visible

**Why it matters:**
- Legal requirement (ADA, WCAG)
- 15% of users have disabilities
- Better for everyone (keyboard shortcuts, clear labels)

**Files:**
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Accessibility Excellence section)
- `web/tests/e2e/specs/analytics-dashboard-screen-reader.spec.ts`
- `web/tests/e2e/specs/analytics-dashboard-axe.spec.ts`

### 3. Error Recovery and Resilience

**What we test:**
- API failures show helpful error messages
- Retry buttons work correctly
- Network disconnection is handled gracefully
- Error boundaries catch React errors
- Users can recover from errors

**Why it matters:**
- Networks are unreliable
- APIs can fail
- Users need to understand what went wrong
- Users need a way to fix it

**Files:**
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Error Recovery section)
- `web/tests/e2e/specs/production/production-ux-improvements.spec.ts` (Error Handling section)

### 4. Edge Cases and Boundary Conditions

**What we test:**
- Very long content (titles, descriptions)
- Rapid user interactions (click spam)
- Empty states with helpful guidance
- Large datasets
- Slow network conditions

**Why it matters:**
- Real users do unexpected things
- Edge cases break in production
- Empty states need to guide users

**Files:**
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Edge Cases section)

### 5. Real-World User Workflows

**What we test:**
- Complete user journeys (signup → first vote)
- Keyboard-only navigation
- Multi-step processes
- State persistence across navigation

**Why it matters:**
- Users don't use features in isolation
- Real workflows reveal integration issues
- Keyboard users need full functionality

**Files:**
- `web/tests/e2e/specs/production/production-comprehensive-journeys.spec.ts`
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Real-World Workflows section)

### 6. Mobile Responsiveness

**What we test:**
- Content is usable on mobile viewports
- Touch targets are large enough (44x44px minimum)
- Text is readable (14px+ font size)
- Layout doesn't break on small screens

**Why it matters:**
- 60%+ of users are on mobile
- Small touch targets are frustrating
- Unreadable text loses users

**Files:**
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Mobile Responsiveness section)

### 7. Security and Privacy UX

**What we test:**
- Sensitive data not exposed in page source
- Logout clears data properly
- Protected content inaccessible after logout
- Rate limiting shows helpful messages

**Why it matters:**
- Security vulnerabilities
- Privacy regulations (GDPR, CCPA)
- User trust

**Files:**
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Security and Privacy UX section)

### 8. Content Quality

**What we test:**
- Text is readable (proper font sizes, contrast)
- Images have alt text
- Content is properly formatted
- Headings are structured correctly

**Why it matters:**
- Accessibility
- SEO
- User comprehension

**Files:**
- `web/tests/e2e/specs/production/production-ux-excellence.spec.ts` (Content Quality section)

## Running Production Tests

### Local (against production URL)

```bash
cd web
PLAYWRIGHT_USE_MOCKS=0 BASE_URL=https://www.choices-app.com npm run test:e2e
```

### CI/CD

Production tests run automatically:
- On push to `main` (if production test files changed)
- Every 6 hours via scheduled cron
- On manual workflow dispatch

**Workflow**: `.github/workflows/production-tests.yml`

## When Tests Fail

### Step 1: Understand the Failure

Read the test output carefully:
- What element was expected?
- What was actually found?
- What's the error message?

### Step 2: Reproduce Locally

Run the failing test locally:
```bash
cd web
npx playwright test tests/e2e/specs/production/production-ux-excellence.spec.ts --grep "test name"
```

### Step 3: Fix the Root Cause

**Don't weaken the test!** Instead:

1. **Performance failures**: Optimize code (lazy loading, code splitting, caching)
2. **Accessibility failures**: Add proper ARIA, labels, keyboard support
3. **Error handling failures**: Add error boundaries, retry logic, helpful messages
4. **Empty state failures**: Add empty state UI with helpful guidance
5. **Loading state failures**: Add loading indicators, skeletons

### Step 4: Verify the Fix

Run the test again to ensure it passes:
```bash
npx playwright test tests/e2e/specs/production/production-ux-excellence.spec.ts --grep "test name"
```

## Best Practices

### 1. Test Real User Scenarios

Don't test implementation details. Test what users actually do:
- ✅ "User can complete onboarding"
- ❌ "Component renders with correct props"

### 2. Test Failure Scenarios

Happy paths are easy. Test what happens when things go wrong:
- Network failures
- API errors
- Invalid input
- Rate limiting

### 3. Test Accessibility

Accessibility isn't optional:
- Keyboard navigation
- Screen reader support
- Proper ARIA attributes
- Focus management

### 4. Test Performance

Users leave slow sites:
- Core Web Vitals
- Time to interactive
- Bundle sizes
- Resource loading

### 5. Test Mobile

Most users are on mobile:
- Responsive layouts
- Touch targets
- Readable text
- Mobile navigation

## Common Issues and Fixes

### Issue: Test fails because element not found

**Fix**: Check if element exists in production. If not, add it. If it does exist, fix the selector.

### Issue: Test fails because timeout

**Fix**: Check if page is actually slow. If yes, optimize performance. If no, increase timeout appropriately.

### Issue: Test fails because validation not working

**Fix**: Add real-time validation to the form. Don't remove the test.

### Issue: Test fails because empty state missing

**Fix**: Add empty state UI with helpful message and actions.

### Issue: Test fails because loading state missing

**Fix**: Add loading indicators (skeletons, spinners) during async operations.

### Issue: Test fails because submit button stays disabled after filling form

**Root Cause**: React controlled inputs require `onChange` events to update React state. Using `fill()` doesn't trigger these events.

**Fix**: 
- **Never use `fill()`** for React controlled inputs
- **Always use `pressSequentially()`** to properly trigger React's `onChange` handlers:
  ```typescript
  // ❌ WRONG - Button will stay disabled
  await emailInput.fill('test@example.com');
  
  // ✅ CORRECT - React state updates properly
  await emailInput.click();
  await emailInput.pressSequentially('test@example.com', { delay: 20 });
  await page.waitForTimeout(300); // Wait for React to process
  ```
- Use the `loginTestUser()` helper from `tests/e2e/helpers/e2e-setup.ts` which handles this correctly
- See `web/tests/e2e/README.md` for detailed examples

## Expanding Tests

When adding new features, add production tests:

1. **User Journey Test**: Can a user complete the full workflow?
2. **Error Handling Test**: What happens when things go wrong?
3. **Accessibility Test**: Can keyboard/screen reader users use it?
4. **Performance Test**: Does it meet Core Web Vitals?
5. **Mobile Test**: Does it work on mobile?

## Monitoring

Production tests run:
- **Scheduled**: Every 6 hours
- **On Push**: When production test files change
- **Manual**: Via GitHub Actions workflow dispatch

Results are available in:
- GitHub Actions workflow runs
- Test artifacts (HTML reports, screenshots)
- CI status checks

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

---

**Remember**: Production tests are your safety net. They catch issues before users do. When they fail, they're telling you something needs to be fixed in the code, not the test.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

