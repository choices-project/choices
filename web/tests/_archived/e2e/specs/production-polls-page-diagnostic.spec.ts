import { test } from '@playwright/test';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

test.describe('Production Polls Page Diagnostic Tests', () => {
  test('polls page diagnostic - check loading state and errors', async ({ page }) => {
    test.setTimeout(120_000);

    // Collect console errors and CSP violations
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const cspViolations: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.includes('Content Security Policy') || text.includes('CSP') || text.includes('vercel.live')) {
          cspViolations.push(text);
        }
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Navigate to polls page (unauthenticated - should redirect or show loading)
    await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait a bit for page to initialize
    await page.waitForTimeout(3_000);
    
    // Check for loading spinner
    const loadingSpinner = page.locator('.animate-spin, [class*="spinner"], [data-testid*="loading"], [aria-busy="true"]');
    const spinnerVisible = await loadingSpinner.first().isVisible({ timeout: 2_000 }).catch(() => false);
    
    // Check for error boundaries
    const errorBoundary = page.locator('[data-testid="error-boundary"], [role="alert"]:has-text("Something went wrong"), [role="alert"]:has-text("Error")');
    const hasErrorBoundary = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
    
    // Check for React errors
    const reactErrors = consoleErrors.filter(err => 
      err.includes('Minified React error') || 
      err.includes('React error #185') ||
      err.includes('Maximum update depth exceeded') ||
      err.includes('hydration')
    );
    
    // Check for polls page specific content
    // We check for the container AND that it's not one of the loading spinners
    const pollsContainer = page.locator('.container.mx-auto.px-4.py-8').filter({
      hasNot: page.locator('[data-testid="polls-loading-mount"], [data-testid="polls-loading-data"]')
    });
    const hasPollsContainer = await pollsContainer.isVisible({ timeout: 2_000 }).catch(() => false);
    const pollsContent = await pollsContainer.textContent().catch(() => '');
    const hasContent = hasPollsContainer && pollsContent && pollsContent.length > 50;
    
    // Check if stuck in loading - polls page loading spinners should not be visible
    const pollsMountSpinner = await page.locator('[data-testid="polls-loading-mount"]').isVisible({ timeout: 500 }).catch(() => false);
    const pollsDataSpinner = await page.locator('[data-testid="polls-loading-data"]').isVisible({ timeout: 500 }).catch(() => false);
    const isStuckLoading = pollsMountSpinner || pollsDataSpinner;
    
    // bodyText captured for diagnostic purposes
    void (await page.locator('body').textContent().catch(() => '') ?? '');
    
    // Get current URL to see if redirected
    const currentUrl = page.url();
    
    // Log findings
    console.log('\n=== DIAGNOSTIC RESULTS ===');
    console.log('Current URL:', currentUrl);
    console.log('Spinner Visible:', spinnerVisible);
    console.log('Polls Mount Spinner:', pollsMountSpinner);
    console.log('Polls Data Spinner:', pollsDataSpinner);
    console.log('Has Polls Container:', hasPollsContainer);
    console.log('Has Error Boundary:', hasErrorBoundary);
    console.log('Has Content:', hasContent);
    console.log('Is Stuck Loading:', isStuckLoading);
    console.log('Console Errors Count:', consoleErrors.length);
    console.log('Console Warnings Count:', consoleWarnings.length);
    console.log('CSP Violations Count:', cspViolations.length);
    console.log('React Errors Count:', reactErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach(err => console.log('  -', err));
    }
    
    if (cspViolations.length > 0) {
      console.log('\nCSP Violations:');
      cspViolations.forEach(violation => console.log('  -', violation));
    }
    
    if (reactErrors.length > 0) {
      console.log('\nReact Errors:');
      reactErrors.forEach(err => console.log('  -', err));
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/polls-page-diagnostic.png', fullPage: true });
    console.log('\nScreenshot saved to test-results/polls-page-diagnostic.png');
    
    // Check CSP header
    const response = await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    if (response) {
      const cspHeader = response.headers()['content-security-policy'] || response.headers()['Content-Security-Policy'];
      if (cspHeader) {
        console.log('\nCSP Header:');
        console.log('  ', cspHeader);
        const hasVercelLive = cspHeader.includes('vercel.live');
        console.log('  Includes vercel.live:', hasVercelLive);
      }
    }
    
    // Report findings
    if (spinnerVisible && isStuckLoading) {
      console.log('\n⚠️  ISSUE: Page appears stuck in loading state');
    }
    
    if (reactErrors.length > 0) {
      console.log('\n❌ ISSUE: React errors detected');
    }
    
    if (cspViolations.length > 0) {
      console.log('\n❌ ISSUE: CSP violations detected');
    }
    
    if (!spinnerVisible && hasContent && !hasErrorBoundary && reactErrors.length === 0) {
      console.log('\n✅ Page appears to be loading correctly');
    }
  });
});

