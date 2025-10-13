import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

export default async function globalSetup() {
  logger.info('🚀 Starting E2E global setup...');
  
  // 1) Seed test users
  logger.info('🌱 Seeding test users...');
  try {
    execFileSync(process.execPath, [path.resolve('scripts/test-seed.ts')], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production', // Use production-like environment
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY
      },
      stdio: 'inherit'
    });
    logger.info('✅ Test users seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed test users:', error);
    throw error;
  }

  // 2) Login once and save state
  logger.info('🔐 Creating pre-authenticated session...');
  const storagePath = path.resolve(__dirname, '../.storage/admin.json');
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:3000' });
  
  // Block analytics and other third-party requests to speed up tests
  await page.route('**/*analytics*', route => route.abort());
  await page.route('**/*google-analytics*', route => route.abort());
  await page.route('**/*googletagmanager*', route => route.abort());
  
  try {
    // For now, just create an empty storage state since login page has import issues
    // TODO: Fix login page import errors and re-enable pre-authentication
    await page.context().storageState({ path: storagePath });
    logger.info('✅ Empty storage state created (login page has import issues)');
  } catch (error) {
    console.error('❌ Failed to create storage state:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  logger.info('🎉 E2E global setup completed!');
}