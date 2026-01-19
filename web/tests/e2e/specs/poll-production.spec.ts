import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

test.describe('Production poll journey', () => {
  test('author completes accessible wizard and sees share dialog', async ({ page }) => {
    const pollTitle = `E2E Production Poll ${Date.now()}`;
    const pollOptions = ['Invest in infrastructure', 'Expand social programs'];
    const [firstOption, secondOption] = pollOptions;
    if (!firstOption || !secondOption) {
      throw new Error('Expected two poll options for production test');
    }
    const pollId = `poll-${Date.now()}`;
    let recordedPayload: Record<string, unknown> | null = null;

    await page.route('**/api/polls', async (route) => {
      recordedPayload = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: pollId,
            title: pollTitle,
          },
          message: 'Poll created successfully',
        }),
      });
    });

    await page.addInitScript(() => {
      const writes: string[] = [];
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (value: string) => {
            writes.push(value);
            return Promise.resolve();
          },
        },
        configurable: true,
      });
      (window as typeof window & { __clipboardWrites?: string[] }).__clipboardWrites = writes;
    });

    await page.goto('/e2e/poll-create', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const nextButton = page.getByRole('button', { name: /^next$/i });

    const titleInput = page.locator('#poll-title-input');
    await titleInput.fill(pollTitle);
    await expect(titleInput).toHaveValue(pollTitle);
    const descriptionInput = page.locator('#poll-description-input');
    await descriptionInput.fill('Validating the end-to-end poll creation flow against the production UI.');
    await expect(descriptionInput).toHaveValue(
      'Validating the end-to-end poll creation flow against the production UI.',
    );
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    const optionInputs = page.locator('input[id^="poll-option-"]');
    await optionInputs.nth(0).fill(firstOption);
    await expect(nextButton).toBeDisabled();
    await optionInputs.nth(1).fill(secondOption);
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await nextButton.click();
    const tagError = page.getByRole('alert').filter({ hasText: /at least one tag/i });
    await expect(tagError).toBeVisible();

    await page.getByRole('button', { name: /^category /i }).first().click();
    await page.fill('#poll-tags-input', 'production');
    await page.getByRole('button', { name: /^add$/i }).click();
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    const publishButton = page.getByRole('button', { name: /publish poll/i });
    await publishButton.click();

    await expect(page.getByText(/Poll published!/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /share your poll/i })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as typeof window & { __clipboardWrites?: string[] }).__clipboardWrites?.length ?? 0,
        ),
      )
      .toBeGreaterThanOrEqual(0);

    expect(recordedPayload).not.toBeNull();
    expect(recordedPayload).toMatchObject({
      title: pollTitle,
      tags: expect.arrayContaining(['production']),
    });
    expect((recordedPayload as { options?: Array<{ text: string }> } | null)?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: firstOption }),
        expect.objectContaining({ text: secondOption }),
      ]),
    );

    await page.getByRole('button', { name: /^close$/i }).first().click();
  });
});
