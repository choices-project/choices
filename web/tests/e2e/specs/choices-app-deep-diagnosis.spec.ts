import { test, expect } from '@playwright/test';

/**
 * Deep Diagnosis Tests for choices-app.com
 *
 * These tests capture detailed information about what's actually happening
 * on the production site to help diagnose issues.
 */

test.describe('Production Deep Diagnosis', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
  });

  test('Capture full auth page state for analysis', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait for potential client-side rendering
    await page.waitForTimeout(10000);

    // Capture full page HTML
    const html = await page.content();
    const bodyText = await page.textContent('body');
    const title = await page.title();

    // Check for React
    const hasReact = await page.evaluate(() => {
      // @ts-ignore
      return !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!window.React;
    });

    // Check for Next.js
    const hasNext = await page.evaluate(() => {
      // @ts-ignore
      return !!window.__NEXT_DATA__ || !!window.next;
    });

    // Check for React root
    const reactRootInfo = await page.evaluate(() => {
      const root = document.getElementById('__next') || document.querySelector('[data-reactroot]');
      if (!root) return { exists: false };

      // @ts-ignore
      const reactRoot = root._reactRootContainer || root._reactInternalInstance;
      return {
        exists: true,
        hasReactRoot: !!reactRoot,
        id: root.id,
        className: root.className,
        childrenCount: root.children.length,
      };
    });

    // Check for form elements
    const formElements = await page.evaluate(() => {
      return {
        emailInputs: document.querySelectorAll('input[type="email"], input#email, input[name="email"]').length,
        passwordInputs: document.querySelectorAll('input[type="password"], input#password, input[name="password"]').length,
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
      };
    });

    // Check console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check for specific text patterns
    const textPatterns = {
      hasOldFallbackText: bodyText?.includes('Please log in to continue') || false,
      hasNewFormText: bodyText?.includes('Sign in') || bodyText?.includes('Sign up') || false,
      hasEmailLabel: bodyText?.toLowerCase().includes('email') || false,
      hasPasswordLabel: bodyText?.toLowerCase().includes('password') || false,
    };

    // Take screenshot
    await page.screenshot({ path: 'test-results/auth-page-full-diagnosis.png', fullPage: true });

    // Log all findings
    const diagnosis = {
      url: page.url(),
      title,
      hasReact,
      hasNext,
      reactRootInfo,
      formElements,
      textPatterns,
      consoleErrors,
      htmlLength: html.length,
      bodyTextLength: bodyText?.length || 0,
      bodyTextPreview: bodyText?.substring(0, 500),
    };

    console.log('=== AUTH PAGE DIAGNOSIS ===');
    console.log(JSON.stringify(diagnosis, null, 2));

    // Save to file for analysis (using Playwright's file system)
    const fs = await import('fs/promises');
    await fs.mkdir('test-results', { recursive: true });
    await fs.writeFile(
      'test-results/auth-page-diagnosis.json',
      JSON.stringify(diagnosis, null, 2)
    );

    // Assertions to fail test if critical issues found
    if (!hasReact && !hasNext) {
      throw new Error('React and Next.js are not initialized. Full diagnosis saved to test-results/auth-page-diagnosis.json');
    }

    if (textPatterns.hasOldFallbackText && !formElements.emailInputs) {
      throw new Error('Old fallback component detected. Full diagnosis saved to test-results/auth-page-diagnosis.json');
    }
  });

  test('Check for JavaScript errors on auth page', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(10000);

    console.log('=== JAVASCRIPT ERRORS ===');
    console.log('Errors:', errors);
    console.log('Warnings:', warnings);

    // Save errors to file
    const fs = await import('fs/promises');
    await fs.mkdir('test-results', { recursive: true });
    await fs.writeFile(
      'test-results/auth-page-errors.json',
      JSON.stringify({ errors, warnings }, null, 2)
    );

    // Fail if critical errors found
    const criticalErrors = errors.filter(e =>
      e.includes('React') ||
      e.includes('hydration') ||
      e.includes('ReferenceError') ||
      e.includes('TypeError')
    );

    if (criticalErrors.length > 0) {
      throw new Error(`Critical JavaScript errors found: ${criticalErrors.join(', ')}`);
    }
  });

  test('Check network requests on auth page load', async ({ page }) => {
    const requests: Array<{ url: string; status: number; method: string }> = [];
    const responses: Array<{ url: string; status: number; contentType: string }> = [];

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        status: 0, // Will be updated when response comes
        method: request.method(),
      });
    });

    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'] || '',
      });
    });

    await page.goto('https://choices-app.com/auth', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    // Find failed requests
    const failedRequests = responses.filter(r => r.status >= 400);
    const jsFiles = responses.filter(r => r.contentType.includes('javascript'));
    const cssFiles = responses.filter(r => r.contentType.includes('css'));

    const networkInfo = {
      totalRequests: requests.length,
      totalResponses: responses.length,
      failedRequests: failedRequests.map(r => ({ url: r.url, status: r.status })),
      jsFiles: jsFiles.length,
      cssFiles: cssFiles.length,
      jsFileUrls: jsFiles.map(r => r.url),
    };

    console.log('=== NETWORK ANALYSIS ===');
    console.log(JSON.stringify(networkInfo, null, 2));

    // Save to file
    const fs = await import('fs/promises');
    await fs.mkdir('test-results', { recursive: true });
    await fs.writeFile(
      'test-results/auth-page-network.json',
      JSON.stringify(networkInfo, null, 2)
    );

    // Fail if critical resources failed to load
    const criticalFailures = failedRequests.filter(r =>
      r.url.includes('_next/static') ||
      r.url.includes('.js') ||
      r.url.includes('.css')
    );

    if (criticalFailures.length > 0) {
      throw new Error(`Critical resources failed to load: ${criticalFailures.map(r => `${r.url} (${r.status})`).join(', ')}`);
    }
  });
});

