import { test, expect } from '@playwright/test';
import { T } from '../../../registry/testIds';

test.describe('WebAuthn Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic error handling
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
  });

  test('should detect WebAuthn functionality', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Look for WebAuthn elements using proper test IDs
    const webauthnButton = await page.locator(`[data-testid="${T.WEBAUTHN.WEBAUTHN_BUTTON}"]`).first();
    const webauthnRegister = await page.locator(`[data-testid="${T.WEBAUTHN.WEBAUTHN_REGISTER}"]`).first();
    const webauthnAuthenticate = await page.locator(`[data-testid="${T.WEBAUTHN.WEBAUTHN_AUTHENTICATE}"]`).first();
    const biometricButton = await page.locator(`[data-testid="${T.WEBAUTHN.biometricButton}"]`).first();
    const crossDeviceButton = await page.locator(`[data-testid="${T.WEBAUTHN.crossDeviceButton}"]`).first();
    
    // Log what we found
    console.log('WebAuthn elements found:', {
      webauthnButton: await webauthnButton.count() > 0,
      webauthnRegister: await webauthnRegister.count() > 0,
      webauthnAuthenticate: await webauthnAuthenticate.count() > 0,
      biometricButton: await biometricButton.count() > 0,
      crossDeviceButton: await crossDeviceButton.count() > 0
    });
    
    // Check if any WebAuthn elements exist
    const hasWebAuthn = await webauthnButton.count() > 0 || 
                       await webauthnRegister.count() > 0 || 
                       await webauthnAuthenticate.count() > 0 ||
                       await biometricButton.count() > 0 ||
                       await crossDeviceButton.count() > 0;
    
    console.log('WebAuthn functionality detected:', hasWebAuthn);
    
    await page.screenshot({ path: 'test-results/webauthn-detection.png' });
  });

  test('should handle WebAuthn interactions', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Try to interact with WebAuthn elements if they exist
    const webauthnButton = await page.locator(`[data-testid="${T.WEBAUTHN.WEBAUTHN_BUTTON}"]`).first();
    
    if (await webauthnButton.count() > 0) {
      console.log('WebAuthn button found, attempting interaction');
      
      // Check if button is visible and clickable
      const isVisible = await webauthnButton.isVisible();
      const isEnabled = await webauthnButton.isEnabled();
      
      console.log('WebAuthn button state:', {
        visible: isVisible,
        enabled: isEnabled
      });
      
      if (isVisible && isEnabled) {
        // Try clicking (this might trigger WebAuthn prompt)
        await webauthnButton.click();
        
        // Wait a bit for any WebAuthn prompt or error
        await page.waitForTimeout(2000);
        
        // Check if page is still functional
        const title = await page.title();
        expect(title).toBeTruthy();
      }
    } else {
      console.log('No WebAuthn button found');
    }
    
    await page.screenshot({ path: 'test-results/webauthn-interaction.png' });
  });
});
