/**
 * Playwright Global Setup
 * 
 * Runs once before all E2E tests.
 * Creates test users automatically using service role key.
 */

import { chromium, type FullConfig } from '@playwright/test';

import { createAllTestUsers } from './create-test-users';

async function globalSetup(config: FullConfig) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎭 Playwright E2E Test Setup');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Create test users
    console.log('📝 Step 1: Setting up test users...');
    await createAllTestUsers();

    // 2. Verify server is accessible
    console.log('\n📡 Step 2: Verifying test server...');
    const baseURL = config.projects[0]?.use?.baseURL || 'http://127.0.0.1:3000';
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      // Wait for server to be ready (with timeout)
      let retries = 0;
      const maxRetries = 30;
      
      while (retries < maxRetries) {
        try {
          const response = await page.goto(baseURL, { 
            waitUntil: 'domcontentloaded',
            timeout: 5000 
          });
          
          if (response?.ok()) {
            console.log(`✅ Server is ready at ${baseURL}`);
            break;
          }
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            throw new Error(`Server not accessible after ${maxRetries} attempts`);
          }
          console.log(`   Waiting for server... (attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } finally {
      await browser.close();
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Setup Complete - Ready to run tests!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Global setup failed:', error);
    console.error('\n═══════════════════════════════════════════════════════\n');
    throw error;
  }
}

export default globalSetup;
