import { expect, test } from '@playwright/test';

/**
 * Investigation tests to understand the production issue
 * 
 * These tests help us understand why the wrong component is rendering
 */

test.describe('Choices App - Investigation', () => {
  test('should check what component is actually being rendered', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(10000);
    
    // Check for markers from the NEW auth page
    const newAuthMarkers = {
      hasHydratedMarker: await page.locator('[data-testid="auth-hydrated"]').count(),
      hasLoginForm: await page.locator('[data-testid="login-form"]').count(),
      hasEmailInput: await page.locator('#email, input[name="email"]').count(),
      hasPasswordInput: await page.locator('#password, input[name="password"]').count(),
    };
    
    // Check for markers from the OLD auth page
    const oldAuthMarkers = {
      hasLoginLink: await page.locator('a[href="/login"]').count(),
      hasPasskeyControls: await page.locator('[data-testid*="passkey"], [data-testid*="webauthn"]').count(),
      hasAuthenticationHeading: (await page.textContent('h1'))?.includes('Authentication') || false,
      hasPleaseLogInText: (await page.textContent('body'))?.includes('Please log in to continue') || false,
    };
    
    console.log('\n=== COMPONENT DETECTION ===');
    console.log('New Auth Page Markers:', JSON.stringify(newAuthMarkers, null, 2));
    console.log('Old Auth Page Markers:', JSON.stringify(oldAuthMarkers, null, 2));
    
    // Check React component tree
    const reactInfo = await page.evaluate(() => {
      // Try to find React fiber nodes
      const root = document.querySelector('#__next');
      const reactRoot = root && (root as any)._reactInternalInstance;
      
      return {
        hasNextRoot: !!root,
        rootId: root?.id || 'none',
        // Check for React DevTools
        hasReactDevTools: typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
      };
    });
    
    console.log('React Info:', JSON.stringify(reactInfo, null, 2));
    
    // Check for JavaScript errors that might prevent React from loading
    const errors = await page.evaluate(() => {
      return {
        // Check if there are any script loading errors
        scriptsLoaded: document.scripts.length,
        // Check for unhandled errors
        hasErrorEvent: typeof (window as any).__playwrightErrors !== 'undefined',
      };
    });
    
    console.log('Script Loading:', JSON.stringify(errors, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/investigation-auth-page.png', fullPage: true });
    
    // Determine which component is rendering
    if (oldAuthMarkers.hasLoginLink && oldAuthMarkers.hasAuthenticationHeading) {
      console.log('\n⚠️  OLD AUTH COMPONENT IS RENDERING');
      console.log('   This suggests:');
      console.log('   1. Wrong component is being imported/used');
      console.log('   2. Build issue - old component in production');
      console.log('   3. Error boundary catching and showing fallback');
      console.log('   4. Routing issue - wrong route being matched');
    } else if (newAuthMarkers.hasLoginForm || newAuthMarkers.hasEmailInput) {
      console.log('\n✅ NEW AUTH COMPONENT IS RENDERING');
    } else {
      console.log('\n❓ UNKNOWN COMPONENT STATE');
    }
    
    expect(true).toBe(true); // Don't fail, just investigate
  });
  
  test('should check for build/routing issues', async ({ page }) => {
    // Check the actual HTML structure
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    const pageInfo = await page.evaluate(() => {
      // Get all script tags
      const scripts = Array.from(document.scripts).map(s => ({
        src: s.src || 'inline',
        async: s.async,
        defer: s.defer,
        type: s.type,
      }));
      
      // Get Next.js data
      const nextData = (window as any).__NEXT_DATA__;
      
      return {
        scripts,
        hasNextData: !!nextData,
        buildId: nextData?.buildId || 'unknown',
        page: nextData?.page || 'unknown',
        props: nextData?.props ? 'present' : 'missing',
      };
    });
    
    console.log('\n=== BUILD/ROUTING INFO ===');
    console.log(JSON.stringify(pageInfo, null, 2));
    
    // Check if the correct page component is loaded
    const componentInfo = await page.evaluate(() => {
      // Look for Next.js component markers
      const nextScripts = Array.from(document.scripts)
        .filter(s => s.src.includes('app/auth/page'))
        .map(s => s.src);
      
      return {
        authPageScripts: nextScripts,
        totalScripts: document.scripts.length,
      };
    });
    
    console.log('Component Scripts:', JSON.stringify(componentInfo, null, 2));
    
    expect(true).toBe(true);
  });
});

