/**
 * WebAuthn Functionality Tests
 * 
 * Comprehensive tests for WebAuthn/Passkey functionality after upgrade
 * Tests registration, authentication, and error handling
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('WebAuthn Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page before each test
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
  });

  test('should load WebAuthn components', async ({ page }) => {
    // Check for WebAuthn/Passkey elements
    const passkeyElements = await page.locator('[data-testid*="passkey"], [data-testid*="webauthn"]').all();
    const passkeyButtons = await page.locator('button:has-text("Passkey"), button:has-text("WebAuthn")').all();
    
    // Should have at least one WebAuthn element
    expect(passkeyElements.length + passkeyButtons.length).toBeGreaterThan(0);
  });

  test('should show WebAuthn registration options', async ({ page }) => {
    // Look for registration-related WebAuthn elements
    const registrationElements = await page.locator('[data-testid*="register"], [data-testid*="signup"]').all();
    const passkeyRegistration = await page.locator('button:has-text("Register"), button:has-text("Sign Up")').all();
    
    // Should have registration options
    expect(registrationElements.length + passkeyRegistration.length).toBeGreaterThan(0);
  });

  test('should show WebAuthn login options', async ({ page }) => {
    // Look for login-related WebAuthn elements
    const loginElements = await page.locator('[data-testid*="login"], [data-testid*="signin"]').all();
    const passkeyLogin = await page.locator('button:has-text("Sign In"), button:has-text("Login")').all();
    
    // Should have login options
    expect(loginElements.length + passkeyLogin.length).toBeGreaterThan(0);
  });

  test('should handle WebAuthn registration flow', async ({ page }) => {
    // Mock WebAuthn API for testing
    await page.addInitScript(() => {
      // Mock WebAuthn APIs
      (window as any).navigator.credentials = {
        create: async () => {
          return {
            id: 'mock-credential-id',
            type: 'public-key',
            rawId: new ArrayBuffer(16),
            response: {
              clientDataJSON: new ArrayBuffer(32),
              attestationObject: new ArrayBuffer(64)
            }
          };
        },
        get: async () => {
          return {
            id: 'mock-credential-id',
            type: 'public-key',
            rawId: new ArrayBuffer(16),
            response: {
              clientDataJSON: new ArrayBuffer(32),
              authenticatorData: new ArrayBuffer(37),
              signature: new ArrayBuffer(64),
              userHandle: new ArrayBuffer(16)
            }
          };
        }
      };
    });

    // Look for WebAuthn registration button
    const passkeyButton = page.locator('button:has-text("Passkey"), button:has-text("WebAuthn")').first();
    
    if (await passkeyButton.isVisible()) {
      // Click WebAuthn registration button
      await passkeyButton.click();
      
      // Wait for any registration flow to start
      await page.waitForTimeout(1000);
      
      // Check for success indicators or error handling
      const successMessage = await page.locator('[data-testid*="success"], .text-green-600').first();
      const errorMessage = await page.locator('[data-testid*="error"], .text-red-600').first();
      
      // Should either show success or handle error gracefully
      const hasFeedback = await successMessage.isVisible() || await errorMessage.isVisible();
      expect(hasFeedback).toBeTruthy();
    }
  });

  test('should handle WebAuthn authentication flow', async ({ page }) => {
    // Mock WebAuthn API for testing
    await page.addInitScript(() => {
      (window as any).navigator.credentials = {
        get: async () => {
          return {
            id: 'mock-credential-id',
            type: 'public-key',
            rawId: new ArrayBuffer(16),
            response: {
              clientDataJSON: new ArrayBuffer(32),
              authenticatorData: new ArrayBuffer(37),
              signature: new ArrayBuffer(64),
              userHandle: new ArrayBuffer(16)
            }
          };
        }
      };
    });

    // Look for WebAuthn login button
    const passkeyButton = page.locator('button:has-text("Passkey"), button:has-text("WebAuthn")').first();
    
    if (await passkeyButton.isVisible()) {
      // Click WebAuthn login button
      await passkeyButton.click();
      
      // Wait for any authentication flow to start
      await page.waitForTimeout(1000);
      
      // Check for success indicators or error handling
      const successMessage = await page.locator('[data-testid*="success"], .text-green-600').first();
      const errorMessage = await page.locator('[data-testid*="error"], .text-red-600').first();
      
      // Should either show success or handle error gracefully
      const hasFeedback = await successMessage.isVisible() || await errorMessage.isVisible();
      expect(hasFeedback).toBeTruthy();
    }
  });

  test('should handle WebAuthn errors gracefully', async ({ page }) => {
    // Mock WebAuthn API to throw errors
    await page.addInitScript(() => {
      (window as any).navigator.credentials = {
        create: async () => {
          throw new Error('WebAuthn registration failed');
        },
        get: async () => {
          throw new Error('WebAuthn authentication failed');
        }
      };
    });

    // Look for WebAuthn button
    const passkeyButton = page.locator('button:has-text("Passkey"), button:has-text("WebAuthn")').first();
    
    if (await passkeyButton.isVisible()) {
      // Click WebAuthn button
      await passkeyButton.click();
      
      // Wait for error handling
      await page.waitForTimeout(1000);
      
      // Should show error message
      const errorMessage = await page.locator('[data-testid*="error"], .text-red-600').first();
      expect(await errorMessage.isVisible()).toBeTruthy();
    }
  });

  test('should support WebAuthn browser compatibility', async ({ page }) => {
    // Check if WebAuthn is supported
    const isWebAuthnSupported = await page.evaluate(() => {
      return !!(window.navigator.credentials && 
                window.navigator.credentials.create && 
                window.navigator.credentials.get);
    });

    if (isWebAuthnSupported) {
      // WebAuthn is supported, check for UI elements
      const passkeyElements = await page.locator('[data-testid*="passkey"], [data-testid*="webauthn"]').all();
      const passkeyButtons = await page.locator('button:has-text("Passkey"), button:has-text("WebAuthn")').all();
      
      // Should have WebAuthn UI elements
      expect(passkeyElements.length + passkeyButtons.length).toBeGreaterThan(0);
    } else {
      // WebAuthn not supported, should show fallback
      const fallbackElements = await page.locator('[data-testid*="fallback"], [data-testid*="alternative"]').all();
      const passwordElements = await page.locator('input[type="password"]').all();
      
      // Should have fallback authentication methods
      expect(fallbackElements.length + passwordElements.length).toBeGreaterThan(0);
    }
  });

  test('should handle WebAuthn user interaction', async ({ page }) => {
    // Test user interaction with WebAuthn elements
    const passkeyButton = page.locator('button:has-text("Passkey"), button:has-text("WebAuthn")').first();
    
    if (await passkeyButton.isVisible()) {
      // Test button interaction
      await passkeyButton.hover();
      await passkeyButton.focus();
      
      // Button should be interactive
      expect(await passkeyButton.isEnabled()).toBeTruthy();
      
      // Test click interaction
      await passkeyButton.click();
      
      // Should show some response (loading, success, or error)
      await page.waitForTimeout(500);
      
      const hasResponse = await page.locator('[data-testid*="loading"], [data-testid*="success"], [data-testid*="error"]').first().isVisible();
      expect(hasResponse).toBeTruthy();
    }
  });

  test('should validate WebAuthn form integration', async ({ page }) => {
    // Check if WebAuthn is integrated with forms
    const forms = await page.locator('form').all();
    const passkeyButtons = await page.locator('button:has-text("Passkey"), button:has-text("WebAuthn")').all();
    
    // Should have forms and WebAuthn buttons
    expect(forms.length).toBeGreaterThan(0);
    expect(passkeyButtons.length).toBeGreaterThan(0);
    
    // WebAuthn buttons should be within or associated with forms
    for (const button of passkeyButtons) {
      const isInForm = await button.evaluate(el => {
        return el.closest('form') !== null;
      });
      expect(isInForm).toBeTruthy();
    }
  });
});
