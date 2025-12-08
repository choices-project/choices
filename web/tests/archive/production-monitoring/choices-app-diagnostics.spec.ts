import { expect, test } from '@playwright/test';

/**
 * Diagnostic tests to identify issues with choices-app.com
 * 
 * These tests help us understand what's happening on the production site
 * so we can fix issues and improve the code.
 */

test.describe('Choices App - Diagnostics', () => {
  test('should identify why auth form is not rendering', async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate to auth page
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for various states
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(10000); // Give it plenty of time
    
    // Check for hydration marker
    const hydratedMarker = await page.locator('[data-testid="auth-hydrated"]').count();
    console.log(`Hydration marker found: ${hydratedMarker}`);
    
    // Check for form
    const formCount = await page.locator('form').count();
    console.log(`Form elements found: ${formCount}`);
    
    // Check for inputs
    const inputCount = await page.locator('input').count();
    console.log(`Input elements found: ${inputCount}`);
    
    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check URL
    console.log(`Current URL: ${page.url()}`);
    
    // Check if redirected
    const finalUrl = page.url();
    const wasRedirected = !finalUrl.includes('/auth');
    console.log(`Was redirected: ${wasRedirected}`);
    
    // Log all console errors
    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    // Log all page errors
    if (pageErrors.length > 0) {
      console.log('\n=== PAGE ERRORS ===');
      pageErrors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }
    
    // Log warnings
    if (consoleWarnings.length > 0) {
      console.log('\n=== CONSOLE WARNINGS ===');
      consoleWarnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
    }
    
    // Check for React root
    const reactRoot = await page.evaluate(() => {
      // Check if React is loaded
      const hasReact = typeof (window as any).React !== 'undefined';
      // Check for Next.js
      const hasNext = typeof (window as any).__NEXT_DATA__ !== 'undefined';
      // Check for hydration errors
      const hydrationErrors = document.querySelectorAll('[data-nextjs-hydration-error]');
      
      return {
        hasReact,
        hasNext,
        hydrationErrorCount: hydrationErrors.length,
        nextData: (window as any).__NEXT_DATA__ ? 'present' : 'missing',
      };
    });
    
    console.log('\n=== REACT/NEXT.JS STATUS ===');
    console.log(JSON.stringify(reactRoot, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/auth-diagnostics.png', fullPage: true });
    
    // Get page HTML structure
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 3000));
    console.log('\n=== PAGE HTML (first 3000 chars) ===');
    console.log(bodyHTML);
    
    // This test doesn't fail - it just collects diagnostic info
    // The real test is: did we learn something?
    expect(true).toBe(true);
  });

  test('should check if JavaScript is executing', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for scripts to load
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    
    // Check if JavaScript is working
    const jsWorking = await page.evaluate(() => {
      return {
        windowDefined: typeof window !== 'undefined',
        documentDefined: typeof document !== 'undefined',
        canCreateElement: typeof document.createElement === 'function',
        hasNextData: typeof (window as any).__NEXT_DATA__ !== 'undefined',
        scriptCount: document.scripts.length,
      };
    });
    
    console.log('JavaScript execution status:', JSON.stringify(jsWorking, null, 2));
    
    // Check if React components are mounting
    const componentStatus = await page.evaluate(() => {
      // Try to find React fiber nodes
      const reactRoot = document.querySelector('#__next');
      const hasReactRoot = reactRoot !== null;
      
      // Check for any React-like attributes
      const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
      
      return {
        hasReactRoot,
        reactRootId: reactRoot?.id || 'none',
        reactLikeElements: reactElements.length,
      };
    });
    
    console.log('Component mounting status:', JSON.stringify(componentStatus, null, 2));
    
    expect(jsWorking.windowDefined).toBe(true);
  });
});

