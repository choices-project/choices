import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('Poll creation validation', () => {
  test('blocks progression until required fields are satisfied', async ({ page }) => {
    await page.goto('/e2e/poll-create');
    await waitForPageReady(page);

    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeDisabled();

    await page.fill('#title', 'Quarterly budget priorities');
    await expect(nextButton).toBeDisabled();

    await page.fill('#description', 'Help us decide where to focus investment next quarter.');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page.getByRole('region', { name: /poll options/i })).toBeVisible();

    await expect(nextButton).toBeDisabled();

    const optionInputs = page.locator('input[aria-label^="Option"]');
    await optionInputs.nth(0).fill('Increase R&D capacity');
    await optionInputs.nth(1).fill('Expand customer support hours');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page.getByRole('region', { name: /audience and discovery/i })).toBeVisible();

    await expect(nextButton).toBeDisabled();

    await page.fill('#tags', 'budget');
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page.getByRole('region', { name: /review and publish/i })).toBeVisible();
  });
});

