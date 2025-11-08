/**
 * Lightweight environment check for the modern Playwright suite.
 * Mirrors the legacy behaviour so npm scripts keep working.
 */

import path from 'path';

import * as dotenv from 'dotenv';

const cwd = process.cwd();

const loadEnv = (filename: string) => {
  const filepath = path.join(cwd, filename);
  dotenv.config({ path: filepath });
};

loadEnv('.env.local');
loadEnv('.env.test.local');

const flag = (value: unknown) => (value ? '✅ Set' : '❌ Missing');

console.log('\n📋 Current E2E test configuration\n');
console.log('NEXT_PUBLIC_SUPABASE_URL:', flag(process.env.NEXT_PUBLIC_SUPABASE_URL));
console.log('SUPABASE_SERVICE_ROLE_KEY:', flag(process.env.SUPABASE_SERVICE_ROLE_KEY));
console.log('E2E_ADMIN_EMAIL:', process.env.E2E_ADMIN_EMAIL ?? '❌ Missing');
console.log('E2E_ADMIN_PASSWORD:', flag(process.env.E2E_ADMIN_PASSWORD));
console.log('PLAYWRIGHT_BASE_URL:', process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000');

console.log('\nℹ️ Values are sourced from .env.local then .env.test.local (if present).');
console.log('   Adjust these files if any required credentials are missing.\n');


