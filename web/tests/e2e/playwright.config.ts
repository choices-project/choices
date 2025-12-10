import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright configuration for the rebuilt E2E suite.
 * Expand projects as real scenarios come online.
 */
const shouldStartServer = process.env.PLAYWRIGHT_NO_SERVER !== '1';
const moduleDir = dirname(fileURLToPath(import.meta.url));
const standaloneScript = join(moduleDir, 'scripts/start-standalone-server.cjs');
const webServerCommand =
  process.env.PLAYWRIGHT_SERVE ?? `npm run build && node ${standaloneScript}`;
const targetBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

const maybeWebServer = shouldStartServer
  ? {
      command: webServerCommand,
      url: `${targetBaseUrl}/api/health`,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe' as const,
      stderr: 'pipe' as const,
      timeout: 300_000,
      env: {
        ...process.env,
        NEXT_DISABLE_REACT_DEV_OVERLAY: '1',
        NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET:
          process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET ?? '0',
        NEXT_PUBLIC_ENABLE_E2E_HARNESS:
          process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS ?? '1',
      },
    }
  : undefined;

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: targetBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(maybeWebServer ? { webServer: maybeWebServer } : {}),
});

