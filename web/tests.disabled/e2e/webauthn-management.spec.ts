/**
 * WebAuthn Management E2E Tests
 * 
 * End-to-end tests for WebAuthn passkey management functionality
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('WebAuthn Passkey Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the profile page (assuming user is logged in)
    await page.goto('/profile');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display passkey management interface @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for biometric setup page
    await expect(page).toHaveURL('/profile/biometric-setup');
    
    // Verify passkey management page loads
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Verify page title
    await expect(page.locator('h1')).toContainText('Biometric Setup');
    
    // Verify add passkey button
    await expect(page.locator('[data-testid="add-passkey-button"]')).toBeVisible();
  });

  test('should list existing passkeys @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Check if passkeys exist
    const passkeyList = page.locator('[data-testid="passkey-list"]');
    const hasPasskeys = await passkeyList.isVisible();
    
    if (hasPasskeys) {
      // Verify passkey list is displayed
      await expect(passkeyList).toBeVisible();
      
      // Verify individual passkey items
      const passkeyItems = page.locator('[data-testid^="passkey-item-"]');
      const count = await passkeyItems.count();
      expect(count).toBeGreaterThan(0);
      
      // Verify each passkey has required elements
      for (let i = 0; i < count; i++) {
        const item = passkeyItems.nth(i);
        await expect(item.locator('[data-testid="passkey-name"]')).toBeVisible();
        await expect(item.locator('[data-testid="passkey-created"]')).toBeVisible();
        await expect(item.locator('[data-testid="passkey-actions"]')).toBeVisible();
      }
    } else {
      // No passkeys, verify empty state
      await expect(page.locator('[data-testid="no-passkeys-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-passkeys-message"]')).toContainText('No passkeys yet');
    }
  });

  test('should add new passkey @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Click add passkey button
    await page.click('[data-testid="add-passkey-button"]');
    
    // Wait for passkey creation prompt
    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
    
    // Handle WebAuthn registration
    await page.waitForTimeout(2000);
    
    // Verify success message
    await expect(page.locator('[data-testid="passkey-success"]')).toBeVisible();
    
    // Verify new passkey appears in list
    await expect(page.locator('[data-testid="passkey-list"]')).toBeVisible();
    
    // Verify passkey count increased
    const passkeyItems = page.locator('[data-testid^="passkey-item-"]');
    const count = await passkeyItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should rename passkey @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Check if passkeys exist
    const passkeyItems = page.locator('[data-testid^="passkey-item-"]');
    const count = await passkeyItems.count();
    
    if (count > 0) {
      // Click rename button on first passkey
      await passkeyItems.first().locator('[data-testid="rename-passkey-button"]').click();
      
      // Wait for rename dialog
      await expect(page.locator('[data-testid="rename-dialog"]')).toBeVisible();
      
      // Enter new name
      await page.fill('[data-testid="passkey-name-input"]', 'My iPhone');
      
      // Submit rename
      await page.click('[data-testid="rename-submit"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="rename-success"]')).toBeVisible();
      
      // Verify name was updated
      await expect(passkeyItems.first().locator('[data-testid="passkey-name"]')).toContainText('My iPhone');
    } else {
      // Skip test if no passkeys exist
      test.skip();
    }
  });

  test('should revoke passkey @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Check if passkeys exist
    const passkeyItems = page.locator('[data-testid^="passkey-item-"]');
    const count = await passkeyItems.count();
    
    if (count > 0) {
      // Click revoke button on first passkey
      await passkeyItems.first().locator('[data-testid="revoke-passkey-button"]').click();
      
      // Wait for confirmation dialog
      await expect(page.locator('[data-testid="revoke-confirmation"]')).toBeVisible();
      
      // Confirm revocation
      await page.click('[data-testid="revoke-confirm"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="revoke-success"]')).toBeVisible();
      
      // Verify passkey was removed from list
      const newCount = await passkeyItems.count();
      expect(newCount).toBe(count - 1);
    } else {
      // Skip test if no passkeys exist
      test.skip();
    }
  });

  test('should handle passkey management errors @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Mock server error for passkey operations
    await page.route('**/api/v1/auth/webauthn/**', route => {
      route.fulfill({ status: 500, body: 'Server error' });
    });
    
    // Try to add new passkey
    await page.click('[data-testid="add-passkey-button"]');
    
    // Wait for error message
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="server-error"]')).toContainText('Server error');
  });

  test('should show passkey usage statistics @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Check if passkeys exist
    const passkeyItems = page.locator('[data-testid^="passkey-item-"]');
    const count = await passkeyItems.count();
    
    if (count > 0) {
      // Verify each passkey shows usage information
      for (let i = 0; i < count; i++) {
        const item = passkeyItems.nth(i);
        
        // Verify created date is shown
        await expect(item.locator('[data-testid="passkey-created"]')).toBeVisible();
        
        // Verify last used date (if available)
        const lastUsed = item.locator('[data-testid="passkey-last-used"]');
        if (await lastUsed.isVisible()) {
          await expect(lastUsed).toBeVisible();
        }
      }
    } else {
      // Skip test if no passkeys exist
      test.skip();
    }
  });

  test('should handle empty passkey state @passkeys', async ({ page }) => {
    // Navigate to biometric setup page
    await page.click('[data-testid="biometric-setup-link"]');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="passkey-management"]')).toBeVisible();
    
    // Check if no passkeys exist
    const passkeyList = page.locator('[data-testid="passkey-list"]');
    const hasPasskeys = await passkeyList.isVisible();
    
    if (!hasPasskeys) {
      // Verify empty state message
      await expect(page.locator('[data-testid="no-passkeys-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-passkeys-message"]')).toContainText('No passkeys yet');
      
      // Verify add passkey button is prominent
      await expect(page.locator('[data-testid="add-passkey-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-passkey-button"]')).toContainText('Add Passkey');
    } else {
      // Skip test if passkeys exist
      test.skip();
    }
  });
});
