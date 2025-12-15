import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

async function stubWebAuthn(page: Page) {
  await page.addInitScript(() => {
    const encoder = new TextEncoder();
    const toBuffer = (value: string) => encoder.encode(value).buffer;

    class MockAttestationResponse {
      attestationObject = new ArrayBuffer(0);
      clientDataJSON = toBuffer('{"type":"webauthn.create"}');
    }

    class MockAssertionResponse {
      authenticatorData = toBuffer('authenticator-data');
      clientDataJSON = toBuffer('{"type":"webauthn.get"}');
      signature = toBuffer('signature');
      userHandle = toBuffer('user-handle');
    }

    class MockCredential {
      id: string = 'test-credential';
      type = 'public-key' as const;
      rawId: ArrayBuffer = Uint8Array.from([1, 2, 3, 4]).buffer;
      response: MockAttestationResponse | MockAssertionResponse;
      constructor(kind: 'register' | 'authenticate') {
        this.response = kind === 'register' ? new MockAttestationResponse() : new MockAssertionResponse();
      }
      getClientExtensionResults() {
        return {};
      }
    }

    const credentialFactory = (kind: 'register' | 'authenticate') => Promise.resolve(new MockCredential(kind));
    const nextCredentials = {
      create: () => credentialFactory('register'),
      get: () => credentialFactory('authenticate'),
    };

    if (!window.isSecureContext) {
      Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    }

    if (typeof navigator.credentials === 'undefined') {
      Object.defineProperty(navigator, 'credentials', { configurable: true, value: nextCredentials });
    } else {
      Object.assign(navigator.credentials, nextCredentials);
    }

    class MockPublicKeyCredential extends MockCredential {
      static async isUserVerifyingPlatformAuthenticatorAvailable() {
        return true;
      }
      static async isConditionalMediationAvailable() {
        return false;
      }
    }

    window.PublicKeyCredential = MockPublicKeyCredential as unknown as typeof PublicKeyCredential;
  });
}

const gotoOnboardingHarness = async (page: Page) => {
  await page.goto('/e2e/onboarding-auth', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(
    () => document.documentElement.dataset.onboardingAuthHarness === 'ready',
    undefined,
    { timeout: 10_000 },
  );
};

test.describe('@mocks onboarding auth flows', () => {
  test.beforeEach(async ({ page }) => {
    await gotoOnboardingHarness(page);
  });

  test('email OTP path updates store and advances step', async ({ page }) => {
    // Mock the API endpoint for email OTP
    await page.route('**/api/auth/send-otp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Login link sent',
        }),
      });
    });

    await page.getByTestId('auth-continue').click();
    await page.getByLabel(/Email Address/i).fill('otp-user@example.com');
    await page.getByRole('button', { name: /Send Login Link/i }).click();

    // Wait for success message - text may vary by i18n, check for multiple possible messages
    // The message might be "Check your email for the login link" or similar i18n variations
    await expect(
      page.getByText(/Check your email|Revisa tu correo|email.*link|login.*link|Login link sent|success/i)
    ).toBeVisible({ timeout: 15_000 });
    
    // Also check for the success indicator - wait a bit for state to update
    await page.waitForTimeout(1000);
    const successIndicator = page.locator('[data-testid="onboarding-auth-data"]');
    await expect(successIndicator).toContainText('"authSetupCompleted": true', {
      timeout: 10_000,
    });
  });

  test('social login option marks auth setup complete', async ({ page }) => {
    await page.getByTestId('auth-option-social').click();
    await page.getByTestId('auth-continue').click();
    await page.getByRole('button', { name: /Continue with Google/i }).click();
    await expect(page.getByTestId('onboarding-auth-data')).toContainText('"authSetupCompleted": true', {
      timeout: 5_000,
    });
  });

  test('passkey path completes and syncs store', async ({ page }) => {
    // Mock the API endpoint for passkey registration
    await page.route('**/api/auth/register-passkey*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Passkey created successfully',
        }),
      });
    });

    await stubWebAuthn(page);
    await page.getByTestId('auth-option-webauthn').click();
    await page.getByTestId('auth-continue').click();
    const passkeyButton = page.getByRole('button', { name: /Create Passkey/i });
    await passkeyButton.click();

    // Wait for success message
    await expect(page.getByText(/Passkey created successfully|success/i)).toBeVisible({ timeout: 10_000 });
    
    // Wait for state to update
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('onboarding-auth-data')).toContainText('"authSetupCompleted": true', {
      timeout: 10_000,
    });
  });

  test('skip path triggers resetUserState and continues flow', async ({ page }) => {
    await page.getByTestId('auth-option-skip').click();
    await page.getByTestId('auth-continue').click();

    await expect(page.getByTestId('onboarding-auth-step')).toHaveText('1', { timeout: 5_000 });
    await expect(page.getByTestId('onboarding-auth-data')).toContainText('"authSetupCompleted": true', {
      timeout: 5_000,
    });
  });
});

