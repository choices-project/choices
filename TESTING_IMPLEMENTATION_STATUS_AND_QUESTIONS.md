# Testing Implementation Status and Questions for Another AI

**Created:** September 14, 2025  
**Updated:** September 14, 2025  
**Status:** Jest 30 + Babel Setup Complete, Module Resolution Issues

## Overview

We've successfully implemented a comprehensive testing suite upgrade based on expert recommendations to fix Jest 30 + ts-jest incompatibility issues. The setup includes Jest with Babel, Playwright with prod-like CI configuration, and Supabase Local integration. However, we're encountering module resolution issues with the admin tests that need expert guidance.

## What We've Implemented

### 1. Dependencies Fixed (No More `^` Versions)

**Removed:**
- `ts-jest@^29.4.1` (incompatible with Jest 30)

**Added with exact versions:**
```json
{
  "devDependencies": {
    "@babel/core": "7.25.7",
    "@babel/preset-env": "7.25.8", 
    "@babel/preset-react": "7.25.7",
    "@babel/preset-typescript": "7.24.7",
    "babel-jest": "30.1.2",
    "tsx": "4.19.2"
  }
}
```

**Fixed existing packages:**
- `client-only`: `^0.0.1` → `0.0.1`
- `server-only`: `^0.0.1` → `0.0.1`
- `eslint-plugin-eslint-comments`: `^3.2.0` → `3.2.0`
- `eslint-plugin-unused-imports`: `^4.2.0` → `4.2.0`

### 2. Jest Configuration (Split Client/Server Projects)

**Main Config:** `/web/jest.config.js`
```javascript
/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/jest.client.config.js',
    '<rootDir>/jest.server.config.js'
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts'
  ],
  coverageThreshold: { 
    global: { 
      lines: 80, 
      functions: 80, 
      branches: 70, 
      statements: 80 
    } 
  }
};
```

**Client Config:** `/web/jest.client.config.js`
```javascript
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'client',
  rootDir: '.',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(t|j)sx?$': ['babel-jest', { rootMode: 'upward' }] },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.(ts|tsx)']
};
```

**Server Config:** `/web/jest.server.config.js`
```javascript
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'server',
  rootDir: '.',
  testEnvironment: 'node',
  transform: { '^.+\\.(t|j)sx?$': ['babel-jest', { rootMode: 'upward' }] },
  testMatch: ['<rootDir>/tests/server/**/*.test.(ts|tsx)']
};
```

### 3. Babel Configuration

**File:** `/web/babel.config.js`
```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript', { allowDeclareFields: true }]
  ]
};
```

### 4. Test Setup and Structure

**Jest Setup:** `/web/tests/setup/jest.setup.ts`
```typescript
import '@testing-library/jest-dom';

// Optional: MSW for unit/integration tests
// import { server } from '../msw/server';
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
```

**Directory Structure:**
```
web/tests/
├── setup/
│   └── jest.setup.ts
├── unit/           # Client-side tests (jsdom)
├── server/         # Server-side tests (node)
│   ├── simple.test.ts
│   ├── admin-auth.test.ts
│   └── admin-apis.test.ts
└── e2e/
    ├── setup/
    │   └── global-setup.ts
    ├── .storage/
    └── admin-system.spec.ts
```

### 5. Playwright Configuration (Prod-like CI)

**File:** `/web/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    storageState: 'tests/e2e/.storage/admin.json' // pre-auth state
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],

  // Dev locally, build+start on CI
  webServer: {
    command: isCI ? 'npm run build && npm start' : 'npm run dev',
    port: 3000,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-dev-key',
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || 'dev-only-secret'
    }
  },

  globalSetup: './tests/e2e/setup/global-setup.ts'
});
```

### 6. Supabase Local Integration

**Test Seed Script:** `/web/scripts/test-seed.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SECRET_KEY!;

async function main() {
  console.log('🌱 Seeding test data...');
  
  const admin = createClient(url, service, { 
    auth: { autoRefreshToken: false, persistSession: false } 
  });

  try {
    // Create admin user
    console.log('Creating admin user...');
    const { data: adminUser, error: adminError } = await admin.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'Passw0rd!123',
      email_confirm: true,
      user_metadata: { is_admin: true },
    });

    if (adminError && !adminError.message.includes('already registered')) {
      console.error('Admin user creation error:', adminError);
    } else {
      console.log('✅ Admin user created/verified');
    }

    // Create regular user
    console.log('Creating regular user...');
    const { data: regularUser, error: regularError } = await admin.auth.admin.createUser({
      email: 'user@example.com',
      password: 'Passw0rd!123',
      email_confirm: true,
      user_metadata: { is_admin: false },
    });

    if (regularError && !regularError.message.includes('already registered')) {
      console.error('Regular user creation error:', regularError);
    } else {
      console.log('✅ Regular user created/verified');
    }

    // Ensure profile rows exist
    console.log('Creating user profiles...');
    
    // Admin profile
    const { error: adminProfileError } = await admin.from('user_profiles').upsert({
      user_id: adminUser?.user?.id || 'admin-user-id',
      email: 'admin@example.com',
      is_admin: true,
      is_active: true,
    }, { onConflict: 'email' });

    if (adminProfileError) {
      console.error('Admin profile error:', adminProfileError);
    } else {
      console.log('✅ Admin profile created/verified');
    }

    // Regular user profile
    const { error: userProfileError } = await admin.from('user_profiles').upsert({
      user_id: regularUser?.user?.id || 'regular-user-id',
      email: 'user@example.com',
      is_admin: false,
      is_active: true,
    }, { onConflict: 'email' });

    if (userProfileError) {
      console.error('User profile error:', userProfileError);
    } else {
      console.log('✅ User profile created/verified');
    }

    console.log('🎉 Test data seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main().catch(err => { 
  console.error('❌ Script failed:', err); 
  process.exit(1); 
});
```

**Global Setup:** `/web/tests/e2e/setup/global-setup.ts`
```typescript
import { request, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export default async function globalSetup(config: FullConfig) {
  const storagePath = path.resolve(__dirname, '../.storage/admin.json');
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });

  // If you have an auth API, hit it once and persist cookies/tokens:
  const context = await request.newContext({ 
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000' 
  });

  // Example: call a test-only endpoint to set an admin session
  // await context.post('/api/test/login-admin', { data: { email: 'admin@example.com' } });

  // If UI login only: you can spin a headless browser here and save state.

  // Persist empty state by default to avoid failures if you don't pre-auth yet.
  await context.storageState({ path: storagePath });
  await context.dispose();
}
```

### 7. Updated Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest -w 1 --selectProjects client server",
    "test:ci": "npm run build && jest -w 1 --selectProjects client server && playwright test",
    "test:pre": "tsx scripts/test-seed.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:schema": "jest --testPathPattern=schema",
    "test:admin": "node scripts/test-admin.js",
    "test:admin:unit": "node scripts/test-admin.js unit",
    "test:admin:e2e": "node scripts/test-admin.js e2e",
    "test:admin:security": "node scripts/test-admin.js security"
  }
}
```

## Current Status

### ✅ What's Working
1. **Jest 30 + Babel setup** - Basic tests run successfully
2. **Dependencies fixed** - No more `^` versions, all pinned
3. **Project structure** - Client/server split implemented
4. **Playwright config** - Prod-like CI setup ready
5. **Supabase Local integration** - Test seeding script ready

### ❌ Current Issues

**Module Resolution Problem:**
```bash
> npm run test:unit

Running 2 projects:
- client
- server
 PASS   server  tests/server/simple.test.ts
 FAIL   server  tests/server/admin-auth.test.ts
  ● Test suite failed to run

    Cannot find module '@/lib/supabase/server' from 'tests/server/admin-auth.test.ts'

      13 |
      14 | // Mock the Supabase server client
    > 15 | jest.mock('@/lib/supabase/server', () => ({
         |      ^
      16 |   getSupabaseServerClient: jest.fn()
   17 | }))

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/server/admin-auth.test.ts:15:6)
```

**The Problem:**
- Jest can't resolve `@/lib/supabase/server` during the mock setup
- The module exists at `/web/lib/supabase/server.ts`
- The `moduleNameMapper` is configured correctly: `'^@/(.*)$': '<rootDir>/$1'`
- Simple tests work fine, but tests that mock modules fail

## Test Files That Need Fixing

### Admin Auth Test: `/web/tests/server/admin-auth.test.ts`
```typescript
// Mock the Supabase server client before importing
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: jest.fn()
}))

import { isAdmin, requireAdmin, getAdminUser } from '@/lib/admin-auth'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const mockGetSupabaseServerClient = getSupabaseServerClient as jest.MockedFunction<typeof getSupabaseServerClient>

describe('Admin Authentication', () => {
  // ... test implementation
});
```

### Admin APIs Test: `/web/tests/server/admin-apis.test.ts`
```typescript
// Mock the admin auth functions before importing
jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn(),
  getAdminUser: jest.fn()
}))

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: jest.fn()
}))

import { NextRequest } from 'next/server'

describe('Admin API Endpoints', () => {
  // ... test implementation
});
```

## Project Structure Context

**Key Files That Exist:**
- `/web/lib/admin-auth.ts` - Contains `isAdmin()`, `requireAdmin()`, `getAdminUser()`
- `/web/lib/supabase/server.ts` - Contains `getSupabaseServerClient()`
- `/web/utils/supabase/server.ts` - Also contains `getSupabaseServerClient()` (duplicate?)

**Import Pattern Used:**
```typescript
// From /web/lib/admin-auth.ts
import { getSupabaseServerClient } from '@/lib/supabase/server'
```

## Questions for Another AI

### 1. Module Resolution Issue
**Primary Question:** Why can't Jest resolve `@/lib/supabase/server` during mock setup, even though:
- The file exists at the correct path
- `moduleNameMapper` is configured: `'^@/(.*)$': '<rootDir>/$1'`
- Simple tests work fine
- The import works in the actual source code

**Possible Solutions to Try:**
- Different mock syntax or placement?
- Jest configuration issue with Babel + TypeScript?
- Module resolution timing issue?
- Need to use `__mocks__` directories instead?

### 2. Babel + Jest + TypeScript Configuration
**Question:** Is our Babel configuration optimal for Jest 30 + TypeScript + Next.js?
```javascript
// Current babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript', { allowDeclareFields: true }]
  ]
};
```

**Specific Concerns:**
- Should we use `rootMode: 'upward'` in Jest configs?
- Are the Babel presets in the right order?
- Do we need additional Babel plugins for Jest?

### 3. Mock Strategy for Next.js + Supabase
**Question:** What's the best practice for mocking Supabase client in Jest tests?

**Current Approach:**
```typescript
jest.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: jest.fn()
}))
```

**Alternatives to Consider:**
- Use `__mocks__` directories?
- Mock at a different level (Supabase client vs our wrapper)?
- Use MSW (Mock Service Worker) instead?
- Different import/mock timing?

### 4. Test Environment Setup
**Question:** Should we be using different Jest configurations for different types of tests?

**Current Setup:**
- Client tests: `jsdom` environment
- Server tests: `node` environment
- Both use same Babel transform

**Considerations:**
- Do server tests need different module resolution?
- Should we mock Next.js APIs differently?
- Any conflicts between client/server test environments?

### 5. Supabase Local Integration
**Question:** Is our Supabase Local setup optimal for testing?

**Current Approach:**
- Use Supabase CLI for local development
- Seed script creates test users
- Playwright uses storage state for auth

**Questions:**
- Should we use different Supabase projects for different test types?
- How to handle database cleanup between tests?
- Best practices for test data isolation?

### 6. CI/CD Integration
**Question:** How should we structure the CI pipeline for this testing setup?

**Current Scripts:**
```json
{
  "test:ci": "npm run build && jest -w 1 --selectProjects client server && playwright test",
  "test:pre": "tsx scripts/test-seed.ts"
}
```

**Considerations:**
- Should we run Supabase Local in CI?
- How to handle test database setup/teardown?
- Parallel vs sequential test execution?

### 7. Performance and Reliability
**Question:** Are there any performance or reliability concerns with our current setup?

**Potential Issues:**
- Jest 30 + Babel performance vs ts-jest
- Playwright + Supabase Local resource usage
- Test execution time with multiple projects

## Next Steps Needed

1. **Fix module resolution** - Primary blocker
2. **Verify Babel configuration** - Ensure optimal setup
3. **Test Supabase Local integration** - Verify seeding works
4. **Set up CI pipeline** - GitHub Actions integration
5. **Add more test coverage** - Expand beyond admin tests
6. **Performance optimization** - Ensure tests run efficiently

## Environment Details

- **Node.js:** 22.19.x
- **npm:** 10.9.3
- **Jest:** 30.1.2
- **Playwright:** 1.55.0
- **Babel:** 7.25.x
- **TypeScript:** 5.7.2
- **Next.js:** 14.2.32
- **Supabase:** 2.55.0

## Files Modified/Created

**New Files:**
- `/web/babel.config.js`
- `/web/jest.config.js`
- `/web/jest.client.config.js`
- `/web/jest.server.config.js`
- `/web/tests/setup/jest.setup.ts`
- `/web/tests/server/simple.test.ts`
- `/web/scripts/test-seed.ts`
- `/web/tests/e2e/setup/global-setup.ts`

**Modified Files:**
- `/web/package.json` (dependencies, scripts)
- `/web/playwright.config.ts` (CI optimization)
- `/web/tests/server/admin-auth.test.ts` (mock placement)
- `/web/tests/server/admin-apis.test.ts` (mock placement)

**Moved Files:**
- `/web/tests/admin/admin-auth.test.ts` → `/web/tests/server/admin-auth.test.ts`
- `/web/tests/admin/admin-apis.test.ts` → `/web/tests/server/admin-apis.test.ts`

---

**Ready for Expert Input:** The setup is 90% complete and follows best practices, but we need expert guidance on the module resolution issue to get the admin tests working properly.
