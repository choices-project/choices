import { expect, test } from '@playwright/test';

/**
 * Minimal core v0.1 smoke tests — Tier 2 scope only.
 * @smoke
 */
test.describe('@smoke Minimal core pages', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/name, office or committee/i)).toBeVisible();
  });

  test('welcome marketing page still renders', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('auth page renders login form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test('polls list page renders', async ({ page }) => {
    await page.goto('/polls');
    await expect(
      page.getByTestId('polls-loading-mount')
        .or(page.getByTestId('polls-loading-data'))
        .or(page.locator('h1'))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('landing stays outside the signed-in shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('app-shell')).toHaveCount(0);
    await expect(page.getByTestId('minimal-navigation')).toHaveCount(0);
  });

  test('public poll page asks unsigned visitors to sign in', async ({ page }) => {
    await page.goto('/polls/adc33472-8b6a-48bd-8cc1-e399ed8485ac');
    await expect(page.getByRole('heading', { name: /core flow check/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('voting-form')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /sign in to vote/i })).toBeVisible();
  });

  test('polls list does not write default filters into the URL', async ({ page }) => {
    await page.goto('/polls');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/polls\/?$/);
  });

  test('polls shows primary nav chrome immediately', async ({ page }) => {
    await page.goto('/polls');
    await expect(page.getByTestId('minimal-navigation')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByTestId('create-nav').or(page.getByTestId('mobile-create-nav')).first()).toBeVisible();
  });

  test('leftover auth and create routes redirect into the core', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/auth/);
    await page.goto('/register');
    await expect(page).toHaveURL(/\/auth/);
    await page.goto('/polls/templates');
    await expect(page).toHaveURL(/\/polls\/create|\/auth/);
    await page.goto('/polls/analytics');
    await expect(page).toHaveURL(/\/polls$/);
  });

  test('poll create page renders form or sign-in gate', async ({ page }) => {
    await page.goto('/polls/create');
    await expect(
      page
        .getByTestId('create-poll-form')
        .or(page.getByRole('heading', { name: /create a poll/i }))
        .or(page.getByTestId('login-form'))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('terms page renders', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  });

  test('privacy page renders', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  });

  test('accountability page renders', async ({ page }) => {
    await page.goto('/accountability');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/name, office or committee/i)).toBeVisible();
  });
});

test.describe('@smoke Signed-in session shell', () => {
  test('login keeps chrome and reaches create and profile', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(
      process.env.PLAYWRIGHT_USE_MOCKS === '1' || !email || !password,
      'Needs a real E2E user and live auth',
    );

    await page.goto('/auth');
    await page.getByTestId('login-email').fill(email as string);
    await page.getByTestId('login-password').fill(password as string);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/polls/, { timeout: 20_000 });
    await expect(page.getByTestId('minimal-navigation')).toBeVisible();
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('create-nav').click();
    await expect(page).toHaveURL(/\/polls\/create/, { timeout: 15_000 });
    await expect(page.getByTestId('create-poll-form')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('app-shell')).toBeVisible();

    await page.getByTestId('profile-nav').click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await expect(page.getByText(/complete your profile|onboarding/i)).toHaveCount(0);

    await page.goto('/polls/adc33472-8b6a-48bd-8cc1-e399ed8485ac');
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 15_000 });
    await expect(
      page
        .getByTestId('voting-form')
        .or(page.getByText(/you have already voted/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: /sign in to vote/i })).toHaveCount(0);
  });
});
