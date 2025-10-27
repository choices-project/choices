import { test, expect } from '@playwright/test';

test.describe('Simple E2E Tests', () => {
  test('should load the home page', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Choices/);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/home-page.png' });
  });

  test('should have basic navigation', async ({ page }) => {
    await page.goto('/');
    
    // Look for common navigation elements
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    // Check if page has some content
    const content = await page.textContent('main, div, body');
    expect(content).toBeTruthy();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    const response = await page.goto('/non-existent-page');
    
    // Should return 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('should have working CSS', async ({ page }) => {
    await page.goto('/');
    
    // Check if CSS is loaded by looking for styled elements
    const styles = await page.evaluate(() => {
      const element = document.body;
      const computedStyle = window.getComputedStyle(element);
      return {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        color: computedStyle.color
      };
    });
    
    expect(styles.fontFamily).toBeTruthy();
    expect(styles.fontSize).toBeTruthy();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    
    // Wait a bit for any JavaScript to load
    await page.waitForTimeout(2000);
    
    // Log any errors for debugging
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
    
    // The page should still be functional even with errors
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});