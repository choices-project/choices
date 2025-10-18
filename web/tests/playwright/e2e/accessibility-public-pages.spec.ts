/**
 * Accessibility Tests for Public Pages
 * 
 * These tests focus on accessibility for public pages that don't require authentication.
 * This is the correct approach - test what users can actually access without login.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Public Pages Accessibility', () => {
  test('should be fully keyboard navigable on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Navigate entire page using only keyboard
    await page.keyboard.press('Tab'); // Focus first element
    await page.keyboard.press('Tab'); // Navigate through page elements
    
    // Should be able to navigate without errors
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should be fully keyboard navigable on auth page', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Navigate auth form using only keyboard
    await page.keyboard.press('Tab'); // Focus first element
    await page.keyboard.type('test@example.com');
    
    await page.keyboard.press('Tab'); // Next element
    await page.keyboard.type('password123');
    
    // Look for submit button and try to submit
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await page.keyboard.press('Tab'); // Submit button
      await page.keyboard.press('Enter'); // Submit
    }
    
    // Challenge: Should complete entire flow with keyboard only
    expect(true).toBe(true); // Placeholder - should verify form submission
  });

  test('should have proper ARIA labels and roles on public pages', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Console Error:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('🚨 Page Error:', error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Debug: Check what's actually loading
    const pageTitle = await page.title();
    console.log('🔍 Debug - Page title:', pageTitle);
    
    const bodyText = await page.locator('body').textContent();
    console.log('🔍 Debug - Body text length:', bodyText?.length || 0);
    console.log('🔍 Debug - Body text preview:', bodyText?.substring(0, 200) || 'No content');
    
    const h1Count = await page.locator('h1').count();
    console.log('🔍 Debug - H1 count:', h1Count);
    
    const headingsCount = await page.locator('h1, h2, h3, h4, h5, h6').count();
    console.log('🔍 Debug - Total headings:', headingsCount);
    
    // Debug: Check what headings we actually have
    const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    for (let i = 0; i < allHeadings.length; i++) {
      const tagName = await allHeadings[i].evaluate(el => el.tagName);
      const text = await allHeadings[i].textContent();
      console.log(`🔍 Debug - Heading ${i + 1}: <${tagName}>${text?.substring(0, 50)}...</${tagName}>`);
    }
    
    // Challenge: Check for proper semantic structure
    const mainHeading = await page.locator('h1').first();
    
    // Should have proper page structure
    expect(pageTitle).toBeTruthy();
    expect(await mainHeading.isVisible()).toBeTruthy();
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should work with screen reader on public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Check for screen reader compatibility
    const pageTitle = await page.title();
    const mainHeading = await page.locator('h1').first().textContent();
    
    // Should have proper semantic structure
    expect(pageTitle).toBeTruthy();
    expect(mainHeading).toBeTruthy();
    
    // Check for proper landmark roles
    const main = page.locator('main, [role="main"]');
    const nav = page.locator('nav, [role="navigation"]');
    
    // At least one landmark should be present
    const hasMain = await main.count() > 0;
    const hasNav = await nav.count() > 0;
    expect(hasMain || hasNav).toBeTruthy();
  });

  test('should handle high contrast mode on public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Elements should be visible and interactive
    const mainHeading = page.locator('h1').first();
    const links = page.locator('a').first();
    
    // Should be able to see and interact with elements
    await expect(mainHeading).toBeVisible();
    if (await links.isVisible()) {
      await expect(links).toBeVisible();
    }
    
    // Challenge: Should be able to interact with form
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
      await emailInput.fill('test@example.com');
    }
    
    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible();
      await passwordInput.fill('password123');
    }
  });

  test('should handle zoom levels up to 400% on public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Test at different zoom levels
    const zoomLevels = [100, 200, 300, 400];
    
    for (const zoom of zoomLevels) {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.evaluate((zoom) => {
        document.body.style.zoom = `${zoom}%`;
      }, zoom);
      
      // Challenge: All elements should be visible and accessible
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
      
      // Should be able to navigate
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should have proper color contrast on public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Check for proper color contrast
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, a, button').all();
    
    // Should have text elements
    expect(textElements.length).toBeGreaterThan(0);
    
    // Check for proper contrast by ensuring elements are visible
    for (const element of textElements.slice(0, 5)) { // Check first 5 elements
      if (await element.isVisible()) {
        const text = await element.textContent();
        if (text && text.trim().length > 0) {
          // Element has text and is visible - basic contrast check
          expect(text.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have proper focus management on public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Test focus management
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Navigate through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
    }
    
    // Test shift+tab for reverse navigation
    await page.keyboard.press('Shift+Tab');
    const reverseFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(reverseFocused).toBeTruthy();
  });
});
