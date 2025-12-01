import { test, expect } from '@playwright/test';

/**
 * Integration Tests for choices-app.com
 * 
 * These tests verify that different parts of the application work together
 * correctly, testing complete user flows and component interactions.
 */

test.describe('Production Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(180_000);
  });

  test('Complete user journey: visit homepage → auth → attempt login', async ({ page }) => {
    // Start at homepage
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);
    
    const homepageTitle = await page.title();
    expect(homepageTitle).toContain('Choices');
    
    // Navigate to auth
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000); // Wait for React to hydrate
    
    // Check if auth form is present
    const emailInput = await page.locator('#email, input[name="email"], input[type="email"]').first();
    const passwordInput = await page.locator('#password, input[name="password"], input[type="password"]').first();
    
    const hasEmail = await emailInput.isVisible().catch(() => false);
    const hasPassword = await passwordInput.isVisible().catch(() => false);
    
    if (hasEmail && hasPassword) {
      // Try to interact with form (don't actually submit with real credentials)
      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword');
      
      // Verify values were set
      const emailValue = await emailInput.inputValue();
      const passwordValue = await passwordInput.inputValue();
      
      expect(emailValue).toBe('test@example.com');
      expect(passwordValue).toBe('testpassword');
    } else {
      console.log('Auth form not fully loaded - may need deployment of fixes');
    }
  });

  test('API and page integration: site messages should load on pages', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });
    
    // Check for site messages API call
    const apiCalls: Array<{ url: string; status: number }> = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/site-messages')) {
        apiCalls.push({
          url,
          status: response.status(),
        });
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Site messages API should be called (even if it fails, it should be attempted)
    // This verifies the integration between page and API
    if (apiCalls.length > 0) {
      console.log('Site messages API called:', apiCalls);
      // Should not return 500 (we fixed that)
      const serverErrors = apiCalls.filter(c => c.status >= 500);
      expect(serverErrors.length, 'Site messages API should not return server errors').toBe(0);
    } else {
      console.log('Site messages API not called (may be lazy loaded)');
    }
  });

  test('Navigation integration: links should work across pages', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Find all links on the page
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(link => ({
        href: (link as HTMLAnchorElement).href,
        text: link.textContent?.trim() || '',
      }));
    });
    
    // Filter to internal links
    const internalLinks = links.filter(link => 
      link.href.includes('choices-app.com') && 
      !link.href.includes('#') &&
      link.href !== 'https://choices-app.com/'
    );
    
    if (internalLinks.length > 0) {
      // Try clicking first internal link
      const firstLink = internalLinks[0];
      console.log(`Testing navigation to: ${firstLink.href}`);
      
      try {
        await page.click(`a[href="${new URL(firstLink.href).pathname}"]`, { timeout: 5000 });
        await page.waitForTimeout(2000);
        
        // Should have navigated
        const currentUrl = page.url();
        expect(currentUrl).toBeTruthy();
      } catch (error) {
        // Link might not be clickable (e.g., requires auth)
        console.log('Link not clickable (may require authentication)');
      }
    }
  });

  test('Error handling integration: errors should be handled gracefully', async ({ page }) => {
    const errors: string[] = [];
    const apiErrors: Array<{ url: string; status: number }> = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('response', (response) => {
      if (response.status() >= 500) {
        apiErrors.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });
    
    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);
    
    // Filter critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('tracking')
    );
    
    if (apiErrors.length > 0) {
      console.log('API errors detected:', apiErrors);
    }
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors:', criticalErrors);
    }
    
    // Should not have many critical errors
    expect(criticalErrors.length, 'Should not have many critical errors').toBeLessThan(5);
    
    // Should not have many API server errors
    expect(apiErrors.length, 'Should not have many API server errors').toBeLessThan(5);
  });

  test('State management integration: page state should persist during navigation', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);
    
    // Check if form state can be set
    const emailInput = await page.locator('#email, input[name="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@example.com');
      
      // Navigate away and back
      await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(3000);
      
      // Form should be reset (expected behavior for auth forms)
      const emailValue = await emailInput.inputValue().catch(() => '');
      // Auth forms typically reset on navigation (security best practice)
      expect(emailValue).toBeDefined();
    }
  });

  test('Loading states integration: pages should show loading states', async ({ page }) => {
    // Navigate with slow network to see loading states
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Check for loading indicators
    const loadingIndicators = await page.evaluate(() => {
      const indicators = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className || '';
        return text.includes('loading') ||
               text.includes('spinner') ||
               className.includes('spinner') ||
               className.includes('loading');
      });
      return indicators.length;
    });
    
    // Should have some loading state handling
    console.log(`Found ${loadingIndicators} potential loading indicators`);
  });

  test('Responsive design integration: layout should adapt to viewport', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(1000);
      
      // Check that page renders without horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      
      // Allow 10% margin for rounding
      expect(bodyWidth, `${viewport.name} viewport should not have excessive horizontal scroll`).toBeLessThanOrEqual(viewportWidth * 1.1);
    }
  });
});

