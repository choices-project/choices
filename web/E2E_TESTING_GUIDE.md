# E2E Testing Guide

## Current Status

### ✅ What's Working
- **TypeScript errors**: Reduced from 541 to 355 (35% reduction)
- **Test infrastructure**: Type-safe test utilities created
- **Unit test cleanup**: Moved 20+ problematic tests to archive
- **Business logic tests**: Kept only valuable unit tests (voting algorithms, validation)

### ⚠️ What Needs Attention
- **E2E tests**: 33 test files exist but require dev server running
- **Test execution**: Need proper CI/CD setup for automated testing

## E2E Test Strategy

### Prerequisites
```bash
# Start the development server
npm run dev

# In another terminal, run E2E tests
npx playwright test tests/playwright/e2e/core/system-tailored-e2e.spec.ts
```

### Test Categories

#### 1. Core User Journeys (Priority 1)
- **Authentication**: Login, logout, session management
- **Polls**: Create, vote, view results
- **Profiles**: View, edit, settings
- **Dashboard**: Main user interface

#### 2. Security Tests (Priority 1)
- **Protected routes**: Redirect unauthenticated users
- **API security**: Proper authentication required
- **Data validation**: Input sanitization

#### 3. Integration Tests (Priority 2)
- **Database operations**: CRUD operations work
- **External APIs**: Third-party integrations
- **File uploads**: Image and document handling

### Recommended E2E Test Structure

```
tests/playwright/e2e/
├── core/                    # Critical user journeys
│   ├── authentication.spec.ts
│   ├── polls.spec.ts
│   ├── profiles.spec.ts
│   └── dashboard.spec.ts
├── security/               # Security-focused tests
│   ├── auth-security.spec.ts
│   └── api-security.spec.ts
├── integration/            # Integration tests
│   ├── database.spec.ts
│   └── external-apis.spec.ts
└── performance/            # Performance tests
    └── load-testing.spec.ts
```

## Current Test Files Analysis

### ✅ Keep These (High Value)
- `core/system-tailored-e2e.spec.ts` - Basic functionality
- `security/authentication-security.spec.ts` - Security tests
- `core/authentication.spec.ts` - Auth flows

### 🔄 Consolidate These (Redundant)
- Multiple authentication test files
- Duplicate dashboard tests
- Similar performance tests

### ❌ Remove These (Low Value)
- Debug test files (`debug-infinite-loop.spec.ts`)
- Minimal test files (`ultra-minimal-test.spec.ts`)
- Component-specific tests (should be unit tests)

## Next Steps

### 1. Immediate Actions
1. **Start dev server** and run core E2E tests
2. **Consolidate redundant** test files
3. **Create focused test suites** for each major feature

### 2. Medium Term
1. **Set up CI/CD** for automated E2E testing
2. **Add performance benchmarks** for critical paths
3. **Create test data factories** for consistent test data

### 3. Long Term
1. **Visual regression testing** for UI changes
2. **Cross-browser testing** for compatibility
3. **Mobile testing** for responsive design

## Running Tests

### Development
```bash
# Start dev server
npm run dev

# Run specific test file
npx playwright test tests/playwright/e2e/core/system-tailored-e2e.spec.ts

# Run all E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui
```

### CI/CD
```bash
# Install dependencies
npm ci

# Build the application
npm run build

# Start production server
npm start

# Run E2E tests
npx playwright test --config=tests/playwright/configs/playwright.config.ci.ts
```

## Test Data Management

### Use Test Utilities
```typescript
import { createMockUser, createMockPoll } from '@/tests/setup/test-utils';

const testUser = createMockUser({ email: 'test@example.com' });
const testPoll = createMockPoll({ title: 'Test Poll' });
```

### Database Seeding
- Use Supabase test database
- Seed with consistent test data
- Clean up after each test run

## Best Practices

### ✅ DO
- Test user behavior, not implementation
- Use realistic test data
- Test error scenarios
- Keep tests independent
- Use page object model for complex flows

### ❌ DON'T
- Test implementation details
- Use hardcoded data
- Skip error testing
- Make tests dependent on each other
- Test third-party libraries

## Maintenance

### Regular Tasks
- **Weekly**: Review failing tests
- **Monthly**: Update test data
- **Quarterly**: Review test coverage

### When to Update Tests
- **User flows change**: Update corresponding E2E tests
- **API changes**: Update integration tests
- **UI changes**: Update visual tests
- **Business logic changes**: Update unit tests

## Success Metrics

### Current Goals
- **E2E test coverage**: 80% of critical user journeys
- **Test execution time**: < 5 minutes for full suite
- **Test reliability**: > 95% pass rate
- **TypeScript errors**: < 50 remaining

### Future Goals
- **Visual regression**: 100% of UI components
- **Performance**: < 3s page load times
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile**: 100% responsive design coverage
