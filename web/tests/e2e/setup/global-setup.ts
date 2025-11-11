import type { FullConfig } from '@playwright/test';

const ensureEnv = (key: string, fallback: string) => {
  if (!process.env[key]) {
    process.env[key] = fallback;
  }
};

export default async function globalSetup(_: FullConfig) {
  ensureEnv('NEXT_PUBLIC_ENABLE_E2E_HARNESS', '1');
  ensureEnv('PLAYWRIGHT_BASE_URL', process.env.BASE_URL ?? 'http://127.0.0.1:3000');
}

