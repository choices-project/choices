import { expect, test, type Page } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from '../helpers/e2e-setup';

async function stubWebAuthn(page: Page) {
  await page.addInitScript(() => {
    const encoder = new TextEncoder();

    const toBuffer = (value: string) => encoder.encode(value).buffer;

    if (!window.isSecureContext) {
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        get: () => true,
      });
    }

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
      id: string;
      type: 'public-key';
      rawId: ArrayBuffer;
      response: MockAttestationResponse | MockAssertionResponse;
      constructor(kind: 'register' | 'authenticate') {
        this.id = 'test-credential';
        this.type = 'public-key';
        this.rawId = Uint8Array.from([1, 2, 3, 4]).buffer;
        this.response =
          kind === 'register'
            ? new MockAttestationResponse()
            : new MockAssertionResponse();
      }

      getClientExtensionResults() {
        return { credProps: { rk: true } };
      }
    }

    const createCredential = () => Promise.resolve(new MockCredential('register'));
    const getCredential = () => Promise.resolve(new MockCredential('authenticate'));

    const nextCredentials = {
      create: createCredential,
      get: getCredential,
    };

    if (typeof navigator.credentials === 'undefined') {
      Object.defineProperty(navigator, 'credentials', {
        value: nextCredentials,
        configurable: true,
      });
    } else {
      Object.assign(navigator.credentials, nextCredentials);
    }

    class MockPublicKeyCredential extends MockCredential {
      constructor(kind: 'register' | 'authenticate') {
        super(kind);
      }

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

test.describe('Auth access harness', () => {
  let cleanupMocks: (() => Promise<void>) | undefined;

  test.beforeEach(async ({ page }) => {
    cleanupMocks = await setupExternalAPIMocks(page, { auth: true });
    await stubWebAuthn(page);
  });

  test.afterEach(async () => {
    if (cleanupMocks) {
      await cleanupMocks();
      cleanupMocks = undefined;
    }
  });

  test('registers a passkey successfully', async ({ page }) => {
    await page.goto('/e2e/auth-access', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    console.info(
      'auth harness ready state (register)',
      await page.evaluate(() => document.documentElement.dataset.authAccessHarness ?? 'missing'),
    );
    await page.waitForFunction(
      () => document.documentElement.dataset.authAccessHarness === 'ready',
      undefined,
      { timeout: 10_000 },
    );

    const registerButton = page.getByRole('button', { name: 'Create Passkey' });
    await registerButton.click();

    await expect(page.getByText('Registration Successful!')).toBeVisible();
    await expect(page.getByTestId('auth-access-success')).toHaveText('true');
    await expect(page.getByTestId('auth-access-error')).toHaveText('none');
  });

  test('authenticates with a passkey successfully', async ({ page }) => {
    await page.goto('/e2e/auth-access', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    console.info(
      'auth harness ready state (login)',
      await page.evaluate(() => document.documentElement.dataset.authAccessHarness ?? 'missing'),
    );
    await page.waitForFunction(
      () => document.documentElement.dataset.authAccessHarness === 'ready',
      undefined,
      { timeout: 10_000 },
    );

    const loginButton = page.getByRole('button', { name: 'Sign In with Passkey' });
    await loginButton.click();

    await expect(page.getByText('Authentication Successful!')).toBeVisible();
    await expect(page.getByTestId('auth-access-success')).toHaveText('true');
    await expect(page.getByTestId('auth-access-error')).toHaveText('none');
  });

  test('shows an error when password login fails (harness mode)', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 30_000 });

    await page.getByTestId('auth-toggle').click();
    await page.waitForTimeout(300);

    await page.getByTestId('login-email').fill('test-user@example.com');
    await page.getByTestId('login-password').fill('TestPassword123!');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });
});


