import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('Test Toggle Component', () => {
  test('test simple toggle', async ({ page }) => {
    await page.goto('/test-toggle');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="${T.testToggle}"]');
    
    // Check initial state
    const initialText = await page.locator('[data-testid="${T.testToggle}"]').textContent();
    logger.info('Initial button text:', initialText);
    
    // Try clicking the button
    await page.locator('[data-testid="${T.testToggle}"]').click();
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Check if text changed
    const afterClickText = await page.locator('[data-testid="${T.testToggle}"]').textContent();
    logger.info('After click button text:', afterClickText);
    
    // Check if sign up mode indicator appears
    const signUpModeVisible = await page.locator('text=Sign Up Mode Active!').isVisible();
    logger.info('Sign up mode visible:', signUpModeVisible);
    
    // The test should pass if the button text changes
    expect(afterClickText).not.toBe(initialText);
  });
});
