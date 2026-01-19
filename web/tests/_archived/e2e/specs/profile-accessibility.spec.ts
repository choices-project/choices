import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const gotoProfileAccessibilityHarness = async (page: Page) => {
  await page.goto('/e2e/profile-accessibility', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await waitForPageReady(page, 60_000);
  await expect(page.getByTestId('profile-accessibility-harness')).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole('button', { name: 'Export Data' })).toBeVisible({
    timeout: 10_000,
  });
};

const escapeForAttributeSelector = (value: string) => value.replace(/"/g, '\\"');

test.describe('@keyboard Profile export dialog accessibility', () => {
  test('announces dialog semantics and manages focus when opening', async ({ page }) => {
    await gotoProfileAccessibilityHarness(page);

    const exportButton = page.getByRole('button', { name: 'Export Data' });
    await exportButton.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Export Your Data' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    const labelledBy = await dialog.getAttribute('aria-labelledby');
    const describedBy = await dialog.getAttribute('aria-describedby');
    if (!labelledBy || !describedBy) {
      throw new Error('Dialog is missing aria-labelledby or aria-describedby attributes');
    }

    await expect(page.locator(`[id="${escapeForAttributeSelector(labelledBy)}"]`)).toHaveText(
      'Export Your Data',
    );
    await expect(page.locator(`[id="${escapeForAttributeSelector(describedBy)}"]`)).toContainText(
      'download a JSON file',
    );

    await expect(page.getByRole('button', { name: 'Close export dialog' })).toBeFocused();
  });

  test('closes via overlay click and Escape keypress', async ({ page }) => {
    const openDialog = async () => {
      await page.getByRole('button', { name: 'Export Data' }).click();
      await expect(page.getByRole('dialog', { name: 'Export Your Data' })).toBeVisible();
    };

    await gotoProfileAccessibilityHarness(page);
    await openDialog();
    await page.getByTestId('profile-export-overlay').dispatchEvent('click');
    await expect(page.getByRole('dialog', { name: 'Export Your Data' })).toBeHidden();

    await openDialog();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Export Your Data' })).toBeHidden();
  });
});

