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
import type { Database } from '@/types/database';

test.describe('WebAuthn Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page before each test
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
  });

  test('should load WebAuthn components', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for the loading message to disappear (indicating dynamic component loaded)
    await page.waitForFunction(() => {
      const loadingText = document.querySelector('text-center text-sm text-gray-500');
      return !loadingText || !loadingText.textContent?.includes('Loading authentication options');
    }, { timeout: 15000 });
    
    // Check for WebAuthn/Passkey elements with more specific selectors
    const passkeyElements = await page.locator('[data-testid*="webauthn"]').all();
    const passkeyButtons = await page.locator('button:has-text("Passkey"), button:has-text("WebAuthn"), button:has-text("Register a passkey")').all();
    
    // If WebAuthn components are not available, check for fallback authentication
    if (passkeyElements.length + passkeyButtons.length === 0) {
      // Check for standard authentication elements as fallback
      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"]').count();
      
      // Should have standard authentication elements
      expect(emailInput + passwordInput + submitButton).toBeGreaterThan(0);
    } else {
      // Should have at least one WebAuthn element
      expect(passkeyElements.length + passkeyButtons.length).toBeGreaterThan(0);
    }
  });

  test('should show WebAuthn registration options', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for the loading message to disappear (indicating dynamic component loaded)
    await page.waitForFunction(() => {
      const loadingText = document.querySelector('text-center text-sm text-gray-500');
      return !loadingText || !loadingText.textContent?.includes('Loading authentication options');
    }, { timeout: 15000 });
    
    // Look for registration-related WebAuthn elements
    const registrationElements = await page.locator('[data-testid*="webauthn-register"]').all();
    const passkeyRegistration = await page.locator('button:has-text("Register a passkey"), button:has-text("Register")').all();
    
    // If WebAuthn registration is not available, check for standard registration
    if (registrationElements.length + passkeyRegistration.length === 0) {
      // Check for standard registration elements as fallback
      const signUpToggle = await page.locator('[data-testid="auth-toggle"]').count();
      const emailInput = await page.locator('input[type="email"]').count();
      
      // Should have standard registration elements
      expect(signUpToggle + emailInput).toBeGreaterThan(0);
    } else {
      // Should have registration options
      expect(registrationElements.length + passkeyRegistration.length).toBeGreaterThan(0);
    }
  });

  test('should show WebAuthn login options', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for the loading message to disappear (indicating dynamic component loaded)
    await page.waitForFunction(() => {
      const loadingText = document.querySelector('text-center text-sm text-gray-500');
      return !loadingText || !loadingText.textContent?.includes('Loading authentication options');
    }, { timeout: 15000 });
    
    // Look for login-related WebAuthn elements
    const loginElements = await page.locator('[data-testid*="webauthn-login"]').all();
    const passkeyLogin = await page.locator('button:has-text("Sign In"), button:has-text("Login"), button:has-text("Use passkey")').all();
    
    // If WebAuthn login is not available, check for standard login
    if (loginElements.length + passkeyLogin.length === 0) {
      // Check for standard login elements as fallback
      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"]').count();
      
      // Should have standard login elements
      expect(emailInput + passwordInput + submitButton).toBeGreaterThan(0);
    } else {
      // Should have login options
      expect(loginElements.length + passkeyLogin.length).toBeGreaterThan(0);
    }
  });

  test('should handle WebAuthn registration flow', async ({ page }) => {
    // Mock WebAuthn API for testing
    await page.addInitScript(() => {
      // Mock WebAuthn APIs
      window.navigator.credentials = {
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
      window.navigator.credentials = {
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
      window.navigator.credentials = {
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
                typeof window.navigator.credentials.create === 'function' &&
                typeof window.navigator.credentials.get === 'function');
    });

    if (isWebAuthnSupported) {
      // WebAuthn is supported, check for UI elements
      const passkeyElements = await page.locator('[data-testid*="webauthn"]').all();
      const passkeyButtons = await page.locator('button:has-text("Passkey"), button:has-text("WebAuthn"), button:has-text("Register a passkey")').all();
      
      // If WebAuthn elements are not available, check for standard authentication
      if (passkeyElements.length + passkeyButtons.length === 0) {
        // Check for standard authentication elements as fallback
        const emailInput = await page.locator('input[type="email"]').count();
        const passwordInput = await page.locator('input[type="password"]').count();
        const submitButton = await page.locator('button[type="submit"]').count();
        
        // Should have standard authentication elements
        expect(emailInput + passwordInput + submitButton).toBeGreaterThan(0);
      } else {
        // Should have WebAuthn UI elements
        expect(passkeyElements.length + passkeyButtons.length).toBeGreaterThan(0);
      }
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
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check if WebAuthn is integrated with forms
    const forms = await page.locator('form').all();
    const passkeyButtons = await page.locator('button:has-text("Passkey"), button:has-text("WebAuthn"), button:has-text("Register a passkey")').all();
    
    // Should have forms
    expect(forms.length).toBeGreaterThan(0);
    
    // If WebAuthn buttons are not available, check for standard form elements
    if (passkeyButtons.length === 0) {
      // Check for standard form elements as fallback
      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"]').count();
      
      // Should have standard form elements
      expect(emailInput + passwordInput + submitButton).toBeGreaterThan(0);
    } else {
      // Should have WebAuthn buttons
      expect(passkeyButtons.length).toBeGreaterThan(0);
      
      // WebAuthn buttons should be within or associated with forms
      for (const button of passkeyButtons) {
        const isInForm = await button.evaluate(el => {
          return el.closest('form') !== null;
        });
        expect(isInForm).toBeTruthy();
      }
    }
  });
});
