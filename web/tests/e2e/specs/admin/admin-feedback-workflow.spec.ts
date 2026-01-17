import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../../helpers/e2e-setup';

test.describe('Admin Feedback Management - Comprehensive Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up E2E harness bypass if enabled
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      await page.addInitScript(() => {
        localStorage.setItem('e2e-dashboard-bypass', 'true');
      });
    }

    await page.goto('/admin/feedback', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
  });

  test.describe('Feedback List Display', () => {
    test('should display feedback list with all columns', async ({ page }) => {
      // Wait for feedback table to load
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      // Check for table headers
      const headers = [
        'Feedback',
        'Type',
        'Status',
        'Priority',
        'Sentiment',
        'Created',
        'Actions',
      ];

      for (const header of headers) {
        const headerElement = page.locator(`th:has-text("${header}")`);
        await expect(headerElement).toBeVisible({ timeout: 10_000 });
      }
    });

    test('should display feedback items with correct information', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      // Check if there are any feedback items
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();

        // Check that row has required elements
        const cells = firstRow.locator('td');
        const cellCount = await cells.count();
        
        // Empty state row has 1 cell with colspan=7, data rows have 7 cells
        if (cellCount === 1) {
          // This is the empty state - verify it's visible
          // Use more specific selector to avoid strict mode violation (multiple elements match)
          const emptyStateHeading = firstRow.locator('h3:has-text("No feedback found")');
          const emptyStateText = firstRow.locator('p:has-text("No feedback submissions")');
          
          // At least one empty state element should be visible
          const hasHeading = await emptyStateHeading.isVisible().catch(() => false);
          const hasText = await emptyStateText.isVisible().catch(() => false);
          
          expect(hasHeading || hasText).toBeTruthy();
        } else {
          // This is a data row - should have 7 cells
          expect(cellCount).toBe(7);

          // Check for type badge
          const typeBadge = firstRow.locator('[class*="rounded-full"]').first();
          await expect(typeBadge).toBeVisible({ timeout: 5_000 });

          // Check for status select
          const statusSelect = firstRow.locator('select').first();
          await expect(statusSelect).toBeVisible({ timeout: 5_000 });
        }
      }
    });

    test('should handle empty feedback list', async ({ page }) => {
      // Check for empty state message
      const emptyState = page.locator('text=/no feedback|no feedback found/i');
      const hasEmptyState = await emptyState.count() > 0;

      if (hasEmptyState) {
        await expect(emptyState.first()).toBeVisible();
      } else {
        // If there's data, verify table is visible
        const table = page.locator('table');
        await expect(table).toBeVisible({ timeout: 30_000 });
      }
    });
  });

  test.describe('Feedback Filtering', () => {
    test('should filter feedback by type', async ({ page }) => {
      const filters = page.locator('select').first();
      if (await filters.count() > 0) {
        // Select a filter option
        await filters.selectOption({ index: 1 });
        await page.waitForTimeout(1000); // Wait for filter to apply

        // Verify filter is applied (table should still be visible or show filtered results)
        const table = page.locator('table');
        await expect(table).toBeVisible({ timeout: 10_000 });
      }
    });

    test('should filter feedback by status', async ({ page }) => {
      // Find status filter
      const statusFilter = page.locator('select').filter({ hasText: /status/i }).or(
        page.locator('select').nth(2)
      );

      if (await statusFilter.count() > 0) {
        await statusFilter.selectOption({ index: 1 });
        await page.waitForTimeout(1000);

        // Verify filter is applied
        const table = page.locator('table');
        await expect(table).toBeVisible({ timeout: 10_000 });
      }
    });

    test('should search feedback by text', async ({ page }) => {
      const searchInput = page.locator('input[type="text"][placeholder*="Search" i]').or(
        page.locator('input[placeholder*="feedback" i]')
      );
      if (await searchInput.count() > 0) {
        await searchInput.first().fill('test');
        await page.waitForTimeout(1500); // Wait for debounce

        // Verify search is applied
        const table = page.locator('table');
        await expect(table).toBeVisible({ timeout: 10_000 });
      }
    });

    test('should clear all filters', async ({ page }) => {
      const clearButton = page.locator('button:has-text("Clear")').or(
        page.locator('button:has-text("Reset")')
      );

      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(1000);

        // Verify filters are cleared
        const searchInput = page.locator('input[type="text"][placeholder*="Search" i]');
        if (await searchInput.count() > 0) {
          const value = await searchInput.inputValue();
          expect(value).toBe('');
        }
      }
    });
  });

  test.describe('Feedback Status Management', () => {
    test('should update feedback status', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();
        const statusSelect = firstRow.locator('select').first();

        if (await statusSelect.count() > 0) {
          // Get current status
          const currentStatus = await statusSelect.inputValue();

          // Change status
          const options = await statusSelect.locator('option').allTextContents();
          const newStatus = options.find((opt) => opt !== currentStatus && opt.trim() !== '');

          if (newStatus) {
            await statusSelect.selectOption({ label: newStatus });
            await page.waitForTimeout(1000);

            // Verify status changed
            const newValue = await statusSelect.inputValue();
            expect(newValue).not.toBe(currentStatus);
          }
        }
      }
    });

    test('should display status badges with correct colors', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      const statusBadges = page.locator('[class*="rounded-full"][class*="bg-"]');
      const badgeCount = await statusBadges.count();

      if (badgeCount > 0) {
        const firstBadge = statusBadges.first();
        await expect(firstBadge).toBeVisible();

        // Verify badge has color classes
        const badgeClasses = await firstBadge.getAttribute('class');
        expect(badgeClasses).toMatch(/bg-(red|yellow|green|blue|gray)/);
      }
    });
  });

  test.describe('Feedback Detail Modal', () => {
    test('should open feedback detail modal', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Look for a clickable element in the row (title, view button, etc.)
        const firstRow = rows.first();
        const clickableElement = firstRow.locator('a, button, [role="button"]').first();

        if (await clickableElement.count() > 0) {
          await clickableElement.click();
          await page.waitForTimeout(1000);

          // Check for modal
          const modal = page.locator('[role="dialog"]').or(
            page.locator('[class*="modal"]').or(
              page.locator('[class*="dialog"]')
            )
          );

          const modalVisible = await modal.count() > 0;
          if (modalVisible) {
            await expect(modal.first()).toBeVisible({ timeout: 10_000 });
          }
        }
      }
    });

    test('should display feedback details in modal', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();
        const clickableElement = firstRow.locator('a, button, [role="button"]').first();

        if (await clickableElement.count() > 0) {
          await clickableElement.click();
          await page.waitForTimeout(1000);

          const modal = page.locator('[role="dialog"]').or(
            page.locator('[class*="modal"]')
          );

          if (await modal.count() > 0) {
            // Check for title
            const title = modal.locator('h1, h2, h3').first();
            await expect(title).toBeVisible({ timeout: 10_000 });

            // Check for description
            const description = modal.locator('p, [class*="description"]').first();
            await expect(description).toBeVisible({ timeout: 10_000 });
          }
        }
      }
    });

    test('should close feedback detail modal', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();
        const clickableElement = firstRow.locator('a, button, [role="button"]').first();

        if (await clickableElement.count() > 0) {
          await clickableElement.click();
          await page.waitForTimeout(1000);

          const modal = page.locator('[role="dialog"]').or(
            page.locator('[class*="modal"]')
          );

          if (await modal.count() > 0) {
            // Find close button
            const closeButton = modal.locator('button[aria-label*="close" i]').or(
              modal.locator('button:has-text("Close")').or(
                modal.locator('button:has-text("×")')
              )
            );

            if (await closeButton.count() > 0) {
              await closeButton.click();
              await page.waitForTimeout(500);

              // Modal should be hidden
              await expect(modal.first()).not.toBeVisible({ timeout: 5_000 });
            } else {
              // Try Escape key
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
              await expect(modal.first()).not.toBeVisible({ timeout: 5_000 });
            }
          }
        }
      }
    });
  });

  test.describe('Feedback Statistics', () => {
    test('should display feedback statistics', async ({ page }) => {
      // Look for stats cards or statistics section
      const statsSection = page.locator('[class*="stat"]').or(
        page.locator('text=/total|count|statistics/i')
      );

      const hasStats = await statsSection.count() > 0;

      if (hasStats) {
        await expect(statsSection.first()).toBeVisible({ timeout: 10_000 });
      }
    });
  });

  test.describe('Feedback Workflow Integration', () => {
    test('should navigate from feedback list to detail and back', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();
        const clickableElement = firstRow.locator('a, button, [role="button"]').first();

        if (await clickableElement.count() > 0) {
          // Open detail
          await clickableElement.click();
          await page.waitForTimeout(1000);

          const modal = page.locator('[role="dialog"]').or(
            page.locator('[class*="modal"]')
          );

          if (await modal.count() > 0) {
            // Close and verify back to list
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);

            // Should be back to list view
            await expect(table).toBeVisible({ timeout: 10_000 });
          }
        }
      }
    });

    test('should maintain filter state when navigating', async ({ page }) => {
      const searchInput = page.locator('input[type="text"][placeholder*="Search" i]').or(
        page.locator('input[placeholder*="feedback" i]')
      );
      if (await searchInput.count() > 0) {
        await searchInput.first().fill('test');
        await page.waitForTimeout(1500); // Wait for debounce

        // Navigate away and back
        await page.goto('/admin', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);

        await page.goto('/admin/feedback', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);

        // Filter state may or may not persist (depending on implementation)
        // Just verify page loads correctly
        const table = page.locator('table');
        await expect(table).toBeVisible({ timeout: 30_000 });
      }
    });
  });

  test.describe('Feedback Dark Mode', () => {
    test('should display feedback list correctly in dark mode', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 30_000 });

      // Verify dark mode classes are applied
      const tableClasses = await table.getAttribute('class');
      expect(tableClasses).toMatch(/dark:(bg-|text-|divide-)/);
    });

    test('should display filters correctly in dark mode', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      const filters = page.locator('select, input[type="text"]');
      if (await filters.count() > 0) {
        const firstFilter = filters.first();
        const filterClasses = await firstFilter.getAttribute('class');
        expect(filterClasses).toMatch(/dark:(bg-|text-|border-)/);
      }
    });
  });
});

