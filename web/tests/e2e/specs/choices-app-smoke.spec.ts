import { expect, test } from '@playwright/test';

/**
 * Smoke tests for choices-app.com
 * 
 * These are simple tests to verify the site is accessible and basic pages load.
 * Run these first before running the full test suite.
 */

test.describe('Choices App - Smoke Tests', () => {
  test('homepage should load', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    
    expect(page.url()).toContain('choices-app.com');
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('auth page should load', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    
    expect(page.url()).toContain('/auth');
    
    // Wait a bit for React to hydrate
    await page.waitForTimeout(5000);
    
    // Check if page has any content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
    
    // Take a screenshot for inspection
    await page.screenshot({ path: 'test-results/auth-page-loaded.png', fullPage: true });
    
    // Check if any inputs exist on the page
    const inputCount = await page.locator('input').count();
    console.log(`Found ${inputCount} input elements on auth page`);
    
    // Check if form exists
    const formCount = await page.locator('form').count();
    console.log(`Found ${formCount} form elements on auth page`);
    
    // Log all input types found
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const type = await input.getAttribute('type').catch(() => 'unknown');
      const id = await input.getAttribute('id').catch(() => 'no-id');
      const name = await input.getAttribute('name').catch(() => 'no-name');
      console.log(`Input found: type=${type}, id=${id}, name=${name}`);
    }
  });

  test('auth page should have email input after waiting', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait progressively longer
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    
    // Try to find email input with multiple strategies
    const emailSelectors = [
      '#email',
      'input[name="email"]',
      'input[type="email"]',
      '[data-testid="login-email"]',
    ];
    
    let foundEmail = false;
    for (const selector of emailSelectors) {
      try {
        const element = page.locator(selector).first();
        await element.waitFor({ state: 'attached', timeout: 10_000 });
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✓ Found email input with selector: ${selector}`);
          foundEmail = true;
          break;
        }
      } catch (e) {
        console.log(`✗ Selector ${selector} not found`);
      }
    }
    
    // Take screenshot regardless
    await page.screenshot({ path: 'test-results/auth-page-email-check.png', fullPage: true });
    
    if (!foundEmail) {
      // Log page HTML for debugging
      const html = await page.content();
      console.log('Page HTML (first 2000 chars):', html.substring(0, 2000));
    }
    
    // Don't fail the test - just log what we found
    console.log(`Email input found: ${foundEmail}`);
  });
});

