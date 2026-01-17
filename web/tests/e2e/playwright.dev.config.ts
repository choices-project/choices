/**
 * Dev Test Configuration
 * 
 * This config is for running tests against an existing dev server.
 * It does NOT start a webServer - assumes server is already running.
 * Use this for faster iteration during development.
 */

import { defineConfig, devices } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envFiles = [
  { path: resolve(__dirname, '../../.env'), override: false },
  { path: resolve(__dirname, '../../.env.test'), override: false },
  { path: resolve(__dirname, '../../.env.test.local'), override: false },
  { path: resolve(__dirname, '../../.env.local'), override: true },
];

for (const { path: envFile, override } of envFiles) {
  try {
    loadDotenv({ path: envFile, override });
  } catch {
    // Ignore errors if file doesn't exist
  }
}

export default defineConfig({
  testDir: './specs',
  testIgnore: ['**/archive/**', '**/_archived/**', '**/setup/**'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Single worker for dev testing
  reporter: 'line',
  timeout: 60_000,
  expect: { timeout: 15_000 },

  // Global setup - creates test users before running tests
  globalSetup: './setup/global-setup.ts',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    extraHTTPHeaders: process.env.PLAYWRIGHT_USE_MOCKS === '1' || process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1'
      ? { 'x-e2e-bypass': '1' }
      : {},
  },

  projects: [
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // NO webServer - assumes dev server is already running
  // This allows faster iteration during development
});

