import { test, expect } from '@playwright/test';

test.describe('Debug Toggle Button', () => {
  test('debug toggle button click', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="auth-toggle"]');
    
    // Check initial state
    const initialText = await page.locator('[data-testid="auth-toggle"]').textContent();
    console.log('Initial button text:', initialText);
    
    // Try clicking the button
    await page.locator('[data-testid="auth-toggle"]').click();
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Try direct state manipulation as workaround
    const stateChanged = await page.evaluate(() => {
      // Try to find React component and trigger state change directly
      const button = document.querySelector('[data-testid="auth-toggle"]');
      if (!button) return false;
      
      // Try to trigger a custom event that React might listen to
      const customEvent = new CustomEvent('toggle', { bubbles: true });
      button.dispatchEvent(customEvent);
      
      // Also try to find any React fiber and trigger state update
      const reactRoot = (button as any)._reactInternalFiber || (button as any)._reactInternalInstance;
      if (reactRoot) {
        console.log('Found React fiber:', reactRoot);
      }
      
      return true;
    });
    console.log('Direct state manipulation attempted:', stateChanged);
    
    // Check if text changed
    const afterClickText = await page.locator('[data-testid="auth-toggle"]').textContent();
    console.log('After click button text:', afterClickText);
    
    // Check if display name field appears
    const displayNameVisible = await page.locator('input[name="displayName"]').isVisible();
    console.log('Display name field visible:', displayNameVisible);
    
    // Check if confirm password field appears
    const confirmPasswordVisible = await page.locator('input[name="confirmPassword"]').isVisible();
    console.log('Confirm password field visible:', confirmPasswordVisible);
    
    // The test should pass if the button text changes
    expect(afterClickText).not.toBe(initialText);
  });
});
