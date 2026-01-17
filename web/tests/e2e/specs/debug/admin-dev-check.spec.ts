/**
 * Dev Mode Admin Check
 * 
 * Quick test to check admin pages in dev mode and capture React errors.
 * This test focuses on getting detailed React error messages for debugging.
 */

import { test } from '@playwright/test';

test.describe('Admin Dev Check', () => {
  test('admin page loads and shows React errors', async ({ page }) => {
    test.setTimeout(120_000);

    const consoleMessages: Array<{ type: string; text: string }> = [];
    const pageErrors: Array<{ message: string; stack?: string }> = [];

    // Capture all console messages
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        console.log(`[CONSOLE ERROR] ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push({ message: error.message, stack: error.stack });
      console.log(`[PAGE ERROR] ${error.message}`);
      if (error.stack) {
        console.log(`[STACK] ${error.stack}`);
      }
    });

    // Navigate to admin page
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait a bit for React to hydrate
    await page.waitForTimeout(3000);

    // Check for React error overlay
    const reactErrorOverlay = await page.locator('nextjs-portal').count();
    console.log(`React error overlay count: ${reactErrorOverlay}`);

    // Check for sidebar
    const sidebar = page.locator('nav[aria-label="Admin navigation"]');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    console.log(`Sidebar visible: ${sidebarVisible}`);

    // Check for main content
    const mainContent = page.locator('main[id="admin-main"]');
    const mainVisible = await mainContent.isVisible().catch(() => false);
    console.log(`Main content visible: ${mainVisible}`);

    // Get page HTML structure
    const bodyHTML = await page.locator('body').innerHTML().catch(() => '');
    const hasAdminLayout = bodyHTML.includes('admin-main') || bodyHTML.includes('Admin sidebar');
    console.log(`Has admin layout: ${hasAdminLayout}`);

    // Log all console errors
    const errors = consoleMessages.filter((m) => m.type === 'error');
    console.log(`\n=== CONSOLE ERRORS (${errors.length}) ===`);
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.text}`);
    });

    // Log page errors
    console.log(`\n=== PAGE ERRORS (${pageErrors.length}) ===`);
    pageErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.message}`);
      if (err.stack) {
        console.log(`   Stack: ${err.stack.substring(0, 200)}...`);
      }
    });

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/admin-dev-check.png', fullPage: true });

    // Basic assertions - don't fail, just report
    console.log(`\n=== SUMMARY ===`);
    console.log(`Sidebar visible: ${sidebarVisible}`);
    console.log(`Main content visible: ${mainVisible}`);
    console.log(`Has admin layout: ${hasAdminLayout}`);
    console.log(`Console errors: ${errors.length}`);
    console.log(`Page errors: ${pageErrors.length}`);

    // Only fail if there are critical errors that prevent the page from loading
    if (!hasAdminLayout && pageErrors.length > 0) {
      throw new Error(`Admin page failed to load. Errors: ${pageErrors.map((e) => e.message).join(', ')}`);
    }
  });
});

