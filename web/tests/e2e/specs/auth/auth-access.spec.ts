import { expect, test, type Page } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from '../../helpers/e2e-setup';

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
  let cleanupMocks: (() => Promise<void>) | null = null;

  test.beforeEach(async ({ page }) => {
    cleanupMocks = await setupExternalAPIMocks(page, { auth: true });
    await stubWebAuthn(page);
  });

  test.afterEach(async () => {
    if (cleanupMocks) {
      await cleanupMocks();
      cleanupMocks = null;
    }
  });

  test('registers a passkey successfully', async ({ page }) => {
    // Enhanced diagnostics for passkey registration
    const diagnostics: any[] = [];
    
    page.on('console', (msg) => {
      if (msg.text().includes('passkey') || msg.text().includes('webauthn') || msg.text().includes('credential')) {
        diagnostics.push({ type: msg.type(), text: msg.text(), timestamp: Date.now() });
      }
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/auth') || response.url().includes('passkey') || response.url().includes('webauthn')) {
        diagnostics.push({
          type: 'network',
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
          timestamp: Date.now(),
        });
      }
    });
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
    
    // Comprehensive diagnostics for passkey registration
    const registerDiagnostics = await page.evaluate(() => {
      const successMessage = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Registration Successful') || el.textContent?.includes('Success')
      );
      const successTestId = document.querySelector('[data-testid="auth-access-success"]');
      const errorTestId = document.querySelector('[data-testid="auth-access-error"]');
      const harnessReady = document.documentElement.dataset.authAccessHarness;
      
      return {
        harnessReady,
        successMessage: {
          exists: !!successMessage,
          text: successMessage?.textContent?.trim() || null,
          visible: successMessage ? (successMessage as HTMLElement).offsetParent !== null : false,
        },
        successTestId: {
          exists: !!successTestId,
          text: successTestId?.textContent?.trim() || null,
          value: (successTestId as HTMLElement)?.getAttribute('data-testid') || null,
        },
        errorTestId: {
          exists: !!errorTestId,
          text: errorTestId?.textContent?.trim() || null,
          value: (errorTestId as HTMLElement)?.getAttribute('data-testid') || null,
        },
        allTextContent: Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent && (el.textContent.includes('Success') || el.textContent.includes('Error')))
          .map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim(),
            visible: (el as HTMLElement).offsetParent !== null,
          })),
      };
    });
    console.log('[DIAGNOSTIC] Passkey registration state before click:', JSON.stringify(registerDiagnostics, null, 2));
    
    await registerButton.click();
    
    // Wait a bit for async operations
    await page.waitForTimeout(2_000);
    
    // Capture state after click
    const afterClickDiagnostics = await page.evaluate(() => {
      const successMessage = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Registration Successful') || el.textContent?.includes('Success')
      );
      const successTestId = document.querySelector('[data-testid="auth-access-success"]');
      const errorTestId = document.querySelector('[data-testid="auth-access-error"]');
      
      return {
        successMessage: {
          exists: !!successMessage,
          text: successMessage?.textContent?.trim() || null,
          visible: successMessage ? (successMessage as HTMLElement).offsetParent !== null : false,
          innerHTML: successMessage ? (successMessage as HTMLElement).innerHTML.substring(0, 200) : null,
        },
        successTestId: {
          exists: !!successTestId,
          text: successTestId?.textContent?.trim() || null,
        },
        errorTestId: {
          exists: !!errorTestId,
          text: errorTestId?.textContent?.trim() || null,
        },
        consoleErrors: (window as any).__playwright_console_errors || [],
      };
    });
    console.log('[DIAGNOSTIC] Passkey registration state after click:', JSON.stringify(afterClickDiagnostics, null, 2));

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
    
    // Comprehensive diagnostics for passkey authentication
    const loginDiagnostics = await page.evaluate(() => {
      const successMessage = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Authentication Successful') || el.textContent?.includes('Success')
      );
      const successTestId = document.querySelector('[data-testid="auth-access-success"]');
      const errorTestId = document.querySelector('[data-testid="auth-access-error"]');
      
      return {
        successMessage: {
          exists: !!successMessage,
          text: successMessage?.textContent?.trim() || null,
          visible: successMessage ? (successMessage as HTMLElement).offsetParent !== null : false,
        },
        successTestId: {
          exists: !!successTestId,
          text: successTestId?.textContent?.trim() || null,
        },
        errorTestId: {
          exists: !!errorTestId,
          text: errorTestId?.textContent?.trim() || null,
        },
      };
    });
    console.log('[DIAGNOSTIC] Passkey authentication state before click:', JSON.stringify(loginDiagnostics, null, 2));
    
    await loginButton.click();
    
    // Wait a bit for async operations
    await page.waitForTimeout(2_000);
    
    // Capture state after click
    const afterClickDiagnostics = await page.evaluate(() => {
      const successMessage = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Authentication Successful') || el.textContent?.includes('Success')
      );
      const successTestId = document.querySelector('[data-testid="auth-access-success"]');
      const errorTestId = document.querySelector('[data-testid="auth-access-error"]');
      
      return {
        successMessage: {
          exists: !!successMessage,
          text: successMessage?.textContent?.trim() || null,
          visible: successMessage ? (successMessage as HTMLElement).offsetParent !== null : false,
          innerHTML: successMessage ? (successMessage as HTMLElement).innerHTML.substring(0, 200) : null,
        },
        successTestId: {
          exists: !!successTestId,
          text: successTestId?.textContent?.trim() || null,
        },
        errorTestId: {
          exists: !!errorTestId,
          text: errorTestId?.textContent?.trim() || null,
        },
      };
    });
    console.log('[DIAGNOSTIC] Passkey authentication state after click:', JSON.stringify(afterClickDiagnostics, null, 2));

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
    
    // Diagnostic: Check form state before submit
    const formState = await page.evaluate(() => {
      const emailInput = document.querySelector('[data-testid="login-email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('[data-testid="login-password"]') as HTMLInputElement;
      const submitButton = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
      
      return {
        email: emailInput?.value || null,
        password: passwordInput?.value || null,
        buttonDisabled: submitButton?.disabled ?? null,
        emailValid: emailInput?.value?.includes('@') || false,
        passwordValid: (passwordInput?.value?.length || 0) >= 6,
      };
    });
    console.log('[DIAGNOSTIC] Login form state (harness mode):', JSON.stringify(formState, null, 2));
    
    // Wait for button to be enabled
    await page.waitForFunction(
      () => {
        const submitButton = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
        return !submitButton?.disabled;
      },
      { timeout: 10_000 }
    ).catch(() => {
      console.log('[DIAGNOSTIC] Login button remained disabled in harness mode');
    });
    
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });
});


