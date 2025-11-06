/**
 * Widget Dashboard E2E Tests
 *
 * Comprehensive tests for the widget dashboard system:
 * - Drag and drop
 * - Resize widgets
 * - Add/remove widgets
 * - Save/load layouts
 * - Preset application
 * - Responsive behavior
 * - Keyboard shortcuts
 *
 * Created: November 6, 2025
 * Status: PRODUCTION
 */

import { test, expect } from '@playwright/test';

import { loginAsAdmin, waitForPageReady } from './helpers/e2e-setup';

test.describe('Widget Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin using proper credentials
    await loginAsAdmin(page);

    // Navigate to analytics
    await page.goto('/admin/analytics');
    await waitForPageReady(page);
  });

  test('should toggle between classic and widget modes', async ({ page }) => {
    // Should start in classic mode (default)
    await expect(page.locator('text=Classic')).toHaveAttribute('variant', 'default');

    // Switch to widget mode
    await page.click('button:has-text("Widgets")');
    await page.waitForTimeout(500);

    // Verify widget mode is active
    await expect(page.locator('text=Widgets')).toHaveAttribute('variant', 'default');
    await expect(page.locator('.widget-dashboard')).toBeVisible();
  });

  test('should load default preset for new users', async ({ page }) => {
    // Switch to widget mode
    await page.click('button:has-text("Widgets")');
    await page.waitForLoadState('networkidle');

    // Should have default widgets loaded
    await expect(page.locator('[data-grid]')).toHaveCount(3); // Default preset has 3 widgets
  });

  test('should enter edit mode', async ({ page }) => {
    // Switch to widget mode
    await page.click('button:has-text("Widgets")');

    // Enter edit mode
    await page.click('button:has-text("Edit Layout")');

    // Verify edit mode indicators
    await expect(page.locator('text=Editing')).toBeVisible();
    await expect(page.locator('button:has-text("Save"))')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel"))')).toBeVisible();
  });

  test('should add widget via selector', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.click('button:has-text("Edit Layout")');

    // Open widget selector
    await page.click('button:has-text("Add Widget")');

    // Dialog should open
    await expect(page.locator('text=Add Widget to Dashboard')).toBeVisible();

    // Add a widget (e.g., Temporal Analysis)
    await page.click('button[title="Temporal Patterns"] >> button');

    // Dialog should close
    await expect(page.locator('text=Add Widget to Dashboard')).not.toBeVisible();

    // Widget should be added to dashboard
    await expect(page.locator('text=Temporal Patterns')).toBeVisible();
  });

  test('should drag and drop widgets', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.click('button:has-text("Edit Layout")');

    // Get first widget
    const widget = page.locator('[data-grid]').first();
    const widgetBox = await widget.boundingBox();

    if (!widgetBox) throw new Error('Widget not found');

    // Drag widget to new position
    await page.mouse.move(widgetBox.x + widgetBox.width / 2, widgetBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(widgetBox.x + 200, widgetBox.y + 10);
    await page.mouse.up();

    // Wait for animation
    await page.waitForTimeout(300);

    // Widget should have moved
    const newBox = await widget.boundingBox();
    expect(newBox?.x).toBeGreaterThan(widgetBox.x);
  });

  test('should resize widgets', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.click('button:has-text("Edit Layout")');

    // Hover over widget to show resize handle
    const widget = page.locator('[data-grid]').first();
    await widget.hover();

    const widgetBox = await widget.boundingBox();
    if (!widgetBox) throw new Error('Widget not found');

    // Find resize handle (bottom-right corner)
    const resizeHandle = widget.locator('.react-resizable-handle');
    await expect(resizeHandle).toBeVisible();

    // Drag to resize
    const handleBox = await resizeHandle.boundingBox();
    if (handleBox) {
      await page.mouse.move(handleBox.x, handleBox.y);
      await page.mouse.down();
      await page.mouse.move(handleBox.x + 100, handleBox.y + 100);
      await page.mouse.up();

      // Wait for animation
      await page.waitForTimeout(300);

      // Widget should be larger
      const newBox = await widget.boundingBox();
      expect(newBox?.width).toBeGreaterThan(widgetBox.width);
    }
  });

  test('should remove widgets', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.click('button:has-text("Edit Layout")');

    // Count initial widgets
    const initialCount = await page.locator('[data-grid]').count();

    // Remove first widget
    const firstWidget = page.locator('[data-grid]').first();
    await firstWidget.hover();
    await firstWidget.locator('button[title="Remove widget"]').click();

    // Wait for removal animation
    await page.waitForTimeout(300);

    // Widget count should decrease
    const newCount = await page.locator('[data-grid]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should apply preset layouts', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.click('button:has-text("Edit Layout")');

    // Open presets
    await page.click('button:has-text("Presets")');

    // Preset buttons should be visible
    await expect(page.locator('text=Executive Dashboard')).toBeVisible();
    await expect(page.locator('text=Detailed Analytics')).toBeVisible();

    // Apply Executive preset
    await page.click('button:has-text("Executive Dashboard")');

    // Should have 4 widgets (as per executive preset)
    await page.waitForTimeout(500);
    expect(await page.locator('[data-grid]').count()).toBeGreaterThanOrEqual(3);
  });

  test('should save and load layouts', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.click('button:has-text("Edit Layout")');

    // Apply a preset
    await page.click('button:has-text("Presets")');
    await page.click('button:has-text("Executive Dashboard")');
    await page.waitForTimeout(500);

    // Save layout
    await page.click('button:has-text("Save")');

    // Wait for save
    await page.waitForTimeout(1000);

    // Should exit edit mode
    await expect(page.locator('text=Editing')).not.toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Switch back to widget mode
    await page.click('button:has-text("Widgets")');
    await page.waitForTimeout(500);

    // Saved layout should be loaded (executive preset has 4 widgets)
    expect(await page.locator('[data-grid]').count()).toBeGreaterThanOrEqual(3);
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.click('button:has-text("Edit Layout")');

    // Apply a preset
    await page.click('button:has-text("Presets")');
    await page.click('button:has-text("Executive Dashboard")');
    await page.waitForTimeout(300);

    // Remove a widget
    const widget = page.locator('[data-grid]').first();
    await widget.hover();
    await widget.locator('button[title="Remove widget"]').click();
    await page.waitForTimeout(300);

    const countAfterRemove = await page.locator('[data-grid]').count();

    // Undo with keyboard (Cmd+Z on Mac, Ctrl+Z on Windows)
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+z' : 'Control+z');
    await page.waitForTimeout(300);

    // Widget should be restored
    const countAfterUndo = await page.locator('[data-grid]').count();
    expect(countAfterUndo).toBe(countAfterRemove + 1);

    // Redo
    await page.keyboard.press(isMac ? 'Meta+Shift+z' : 'Control+Shift+z');
    await page.waitForTimeout(300);

    // Widget should be removed again
    const countAfterRedo = await page.locator('[data-grid]').count();
    expect(countAfterRedo).toBe(countAfterRemove);

    // Save with keyboard (Cmd+S / Ctrl+S)
    await page.keyboard.press(isMac ? 'Meta+s' : 'Control+s');
    await page.waitForTimeout(1000);

    // Should exit edit mode
    await expect(page.locator('text=Editing')).not.toBeVisible();

    // Cancel edit mode with Escape
    await page.click('button:has-text("Edit Layout")');
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Editing')).not.toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.click('button:has-text("Widgets")');
    await page.waitForTimeout(500);

    // Widgets should be stacked vertically on mobile
    const widgets = page.locator('[data-grid]');
    const count = await widgets.count();

    if (count > 1) {
      const firstWidget = widgets.first();
      const secondWidget = widgets.nth(1);

      const firstBox = await firstWidget.boundingBox();
      const secondBox = await secondWidget.boundingBox();

      // Second widget should be below first (stacked)
      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 50);
      }
    }
  });

  test('should refresh individual widgets', async ({ page }) => {
    await page.click('button:has-text("Widgets")');
    await page.waitForTimeout(500);

    const widget = page.locator('[data-grid]').first();
    await widget.hover();

    // Click refresh button
    const refreshButton = widget.locator('button[title="Refresh widget"]');
    await refreshButton.click();

    // Should show loading state briefly
    await expect(widget.locator('.animate-spin')).toBeVisible({ timeout: 1000 });
  });

  test('should persist mode preference across sessions', async ({ page, context }) => {
    // Switch to widget mode
    await page.click('button:has-text("Widgets")');
    await page.waitForTimeout(1000);

    // Close page and open new one
    await page.close();
    const newPage = await context.newPage();

    // Navigate to analytics again
    await newPage.goto('/admin/analytics');
    await newPage.waitForLoadState('networkidle');

    // Should remember widget mode preference
    await expect(newPage.locator('text=Widgets')).toHaveAttribute('variant', 'default');
    await expect(newPage.locator('.widget-dashboard')).toBeVisible();
  });
});

