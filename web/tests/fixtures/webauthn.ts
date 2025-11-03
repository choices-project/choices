/**
 * WebAuthn Testing Fixtures
 * 
 * Provides browser-specific WebAuthn testing capabilities:
 * - Chromium: Full CDP virtual authenticator support
 * - Firefox/WebKit: Mocked WebAuthn API for component testing
 * 
 * Created: January 18, 2025
 */

/* eslint-disable react-hooks/rules-of-hooks */
// This file uses Playwright's `use` fixture function, not React hooks

import { test as base } from '@playwright/test';

type WebAuthnMode = 'chromium' | 'mock';
type Fixtures = { webauthnMode: WebAuthnMode };

export const test = base.extend<Fixtures>({
  webauthnMode: async ({ browserName, page }, use) => {
    if (browserName === 'chromium') {
      // Chromium: Set up full CDP virtual authenticator
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('WebAuthn.enable');

      // CDP options per Chrome DevTools docs (ctap2 is modern, internal simulates platform authenticator)
      // Has resident keys & user verification for passkey (discoverable) flows.
      await cdp.send('WebAuthn.addVirtualAuthenticator', {
        options: {
          protocol: 'ctap2',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
          isUserVerified: true,
          automaticPresenceSimulation: true,
        },
      });

      await use('chromium');

      // Cleanup
      await cdp.send('WebAuthn.disable');
    } else {
      // Non-Chromium: Provide a light stub so component tests don't explode
      await page.addInitScript(() => {
        // Minimal shim – good enough for rendering & basic interaction tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).PublicKeyCredential ??= class PublicKeyCredential {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).credentials ??= {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).credentials.create = async () => ({
          id: 'dummy',
          type: 'public-key',
          rawId: new ArrayBuffer(16),
          response: {},
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).credentials.get = async () => ({
          id: 'dummy',
          type: 'public-key',
          rawId: new ArrayBuffer(16),
          response: {},
        });
      });
      await use('mock');
    }
  },
});

export { expect } from '@playwright/test';

/* eslint-enable react-hooks/rules-of-hooks */
