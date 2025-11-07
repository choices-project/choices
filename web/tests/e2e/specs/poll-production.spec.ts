import { expect, test } from '@playwright/test';
import type { Cookie } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

import {
  ensureLoggedOut,
  waitForPageReady,
  type TestUser,
} from '../helpers/e2e-setup';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env.test.local', override: true });

const REQUIRED_ENV_VARS = ['E2E_USER_EMAIL', 'E2E_USER_PASSWORD'] as const;

test.describe('Production poll journey', () => {
  const missingEnv = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]);
  if (missingEnv.length > 0) {
    test.skip(true, `Missing environment variables: ${missingEnv.join(', ')}`);
  }

  test('regular user can create and vote on a poll in production flows', async ({ page }) => {
    const credentials: TestUser = {
      email: process.env.E2E_USER_EMAIL!,
      username: process.env.E2E_USER_EMAIL!.split('@')[0] ?? 'e2e-user',
      password: process.env.E2E_USER_PASSWORD!,
    };

    page.on('console', (msg) => {

      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });

    await ensureLoggedOut(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: credentials.email,
        password: credentials.password,
      },
      headers: { 'content-type': 'application/json' },
    });

    if (!loginResponse.ok()) {
      const body = await loginResponse.json().catch(() => ({}));
      throw new Error(`Login failed: ${body?.error ?? loginResponse.status()}`);
    }

    const { hostname } = new URL(page.url());
    const cookieHeaders = loginResponse.headersArray().filter(({ name }) => name.toLowerCase() === 'set-cookie');

    const cookies: Cookie[] = cookieHeaders
      .map(({ value }) => {
        const segments = value
          .split(';')
          .map((segment) => segment.trim())
          .filter(Boolean);
        if (segments.length === 0) {
          return null;
        }

        const [nameValue, ...attributes] = segments;
        if (!nameValue) {
          return null;
        }

        const [name, ...valueParts] = nameValue.split('=');
        if (!name) {
          return null;
        }

        const cookie: Cookie = {
          name,
          value: valueParts.join('=') ?? '',
          domain: hostname,
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
          expires: Math.floor(Date.now() / 1000) + 3600,
        };

        for (const attribute of attributes) {
          const [rawAttrName, ...rawAttrValue] = attribute.split('=');
          if (!rawAttrName) {
            continue;
          }
          const attrName = rawAttrName.toLowerCase();
          const attrValue = rawAttrValue.join('=');

          switch (attrName) {
            case 'path':
              cookie.path = attrValue || '/';
              break;
            case 'domain':
              if (attrValue) {
                cookie.domain = attrValue.startsWith('.') ? attrValue.substring(1) : attrValue;
              }
              break;
            case 'expires': {
              const expires = Date.parse(attrValue);
              if (!Number.isNaN(expires)) {
                cookie.expires = Math.floor(expires / 1000);
              }
              break;
            }
            case 'max-age': {
              const maxAge = parseInt(attrValue, 10);
              if (!Number.isNaN(maxAge)) {
                cookie.expires = Math.floor(Date.now() / 1000) + maxAge;
              }
              break;
            }
            case 'secure':
              cookie.secure = true;
              break;
            case 'httponly':
              cookie.httpOnly = true;
              break;
            case 'samesite':
              if (/^strict$/i.test(attrValue)) {
                cookie.sameSite = 'Strict';
              } else if (/^none$/i.test(attrValue)) {
                cookie.sameSite = 'None';
              } else {
                cookie.sameSite = 'Lax';
              }
              break;
            default:
              break;
          }
        }

        return cookie;
      })
      .filter((cookie): cookie is Cookie => cookie !== null);

    await page.context().addCookies(cookies);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    await page.goto('/polls/create');
    await waitForPageReady(page);

    const pollTitle = `E2E Production Poll ${Date.now()}`;
    const pollOptions = ['Invest in infrastructure', 'Expand social programs'];
    const pollResponse = await page.request.post('/api/polls', {
      data: {
        title: pollTitle,
        question: pollTitle,
        description: 'Validating the end-to-end poll creation flow against the production UI.',
        options: pollOptions,
        category: 'community',
        tags: ['e2e', 'production'],
        settings: {
          allowMultipleVotes: false,
          allowAnonymousVotes: true,
          showResultsBeforeClose: true,
          allowComments: true,
          allowSharing: true,
          privacyLevel: 'public',
        },
      },
      headers: { 'content-type': 'application/json' },
    });

    if (!pollResponse.ok()) {
      const errorText = await pollResponse.text();
      throw new Error(`Failed to create poll: ${errorText}`);
    }

    const pollJson = await pollResponse.json();
    const pollId = pollJson?.data?.id as string | undefined;

    expect(pollId).toBeTruthy();

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
      (window as any).__clipboardWrites = writes;
    });

    await page.goto(`/polls/${pollId}`);
    await waitForPageReady(page);

    await expect(page.getByTestId('poll-details')).toBeVisible();
    await expect(page.getByTestId('poll-title')).toHaveText(pollTitle);

    const shareButton = page.getByRole('button', { name: 'Share' });
    await expect(shareButton).toBeVisible();

    await shareButton.click();
    await expect.poll(async () =>
      page.evaluate(() => (Array.isArray((window as any).__clipboardWrites) ? (window as any).__clipboardWrites.length : 0))
    ).toBeGreaterThan(0);

    const firstVoteButton = page.getByTestId('vote-button-0');
    await expect(firstVoteButton).toBeVisible();
    await firstVoteButton.click();
    await expect(firstVoteButton).toHaveText(/Voted/i);
  });
});
