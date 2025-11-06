# Testing Guide

Comprehensive testing guide for the Choices Platform project. This document covers all aspects of testing including unit tests, integration tests, E2E tests, and best practices.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Debugging Tests](#debugging-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

```bash
# Ensure you have the correct Node.js version
node --version  # Should be >= 24.11.0

# Install dependencies
cd web
npm install
```

### Run All Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## Test Types

### 1. Unit Tests (Jest)

**Location**: `web/tests/unit/`

Unit tests focus on testing individual functions, classes, and components in isolation.

**Current Coverage**:
- Vote validation and processing (232 tests)
- IRV calculator
- Rate limiting
- Privacy utilities
- Message templates

**Example**:
```typescript
import { describe, it, expect } from '@jest/globals';
import { VoteValidator } from '@/lib/vote/validator';

describe('VoteValidator', () => {
  it('should validate valid vote data', async () => {
    const validator = new VoteValidator();
    const result = await validator.validateVote(mockVoteData, mockPoll);
    expect(result.isValid).toBe(true);
  });
});
```

### 2. Integration Tests (Jest)

**Location**: `web/tests/api/`

Integration tests verify that different parts of the system work together correctly.

**Current Coverage**:
- API endpoints
- Database operations
- Service interactions

### 3. End-to-End Tests (Playwright)

**Location**: `web/tests/e2e/`

E2E tests simulate real user scenarios across the entire application stack.

**Current Coverage**:
- Authentication flows (2 files)
- Civics features (9 files)
- PWA functionality (6 files)
- Poll management
- Analytics
- User journeys

**Example**:
```typescript
import { test, expect } from '@playwright/test';

test('user can create a poll', async ({ page }) => {
  await page.goto('/polls/create');
  await page.fill('[data-testid="poll-title"]', 'Test Poll');
  await page.click('[data-testid="submit-button"]');
  await expect(page).toHaveURL(/\/polls\//);
});
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run in watch mode (auto-rerun on changes)
npm run test:watch

# Run specific test file
npm test -- vote-validator.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="validate valid"

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- authentication-flow.spec.ts

# Run in debug mode
npm run test:e2e:debug

# Run against staging
npm run test:e2e:staging

# Run against production
npm run test:e2e:production
```

### Performance Tests

```bash
# Run performance tests
npm run test:performance

# Run load tests
npm run test:load
```

### All Tests (CI Pipeline)

```bash
# Run all tests (unit + E2E)
npm run test:ci
```

---

## Writing Tests

### Test File Structure

```
web/
├── tests/
│   ├── unit/              # Unit tests
│   │   ├── vote/
│   │   ├── analytics/
│   │   └── lib/
│   ├── api/               # Integration tests
│   │   └── civics/
│   ├── e2e/               # E2E tests
│   │   ├── auth/
│   │   ├── polls/
│   │   └── civics/
│   ├── helpers/           # Test utilities
│   │   ├── supabase-mock.ts
│   │   └── arrange-helpers.ts
│   └── fixtures/          # Test data
│       └── webauthn.ts
```

### Naming Conventions

- **Unit tests**: `*.test.ts` or `*.spec.ts`
- **E2E tests**: `*.spec.ts`
- **Descriptive names**: `vote-validator.test.ts`, `authentication-flow.spec.ts`

### Test Templates

#### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('methodName', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle invalid input', () => {
      // Test error cases
    });
  });
});
```

#### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="input"]', 'value');
    
    // Act
    await page.click('[data-testid="submit"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Using Test IDs

Always use `data-testid` attributes for selecting elements:

```tsx
// Component
<button data-testid="submit-button">Submit</button>

// Test
await page.click('[data-testid="submit-button"]');
```

### Mocking

#### Supabase Mocking

```typescript
import { getMS } from '../../setup';

const mockSetup = getMS();
const { when, client } = mockSetup;

// Setup mock response
when()
  .table('polls')
  .op('select')
  .eq('id', 'poll-123')
  .returnsSingle({ id: 'poll-123', title: 'Test Poll' });
```

#### API Mocking

```typescript
// Mock external API
await page.route('**/api/external/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' })
  });
});
```

---

## Test Coverage

### Coverage Reports

After running tests with coverage, reports are generated in:
- **HTML**: `web/coverage/index.html` (open in browser)
- **LCOV**: `web/coverage/lcov.info` (for CI tools)
- **JSON**: `web/coverage/coverage-final.json`

### Coverage Thresholds

```javascript
{
  lines: 80,      // 80% of lines must be covered
  functions: 80,  // 80% of functions must be covered
  branches: 70,   // 70% of branches must be covered
  statements: 80  // 80% of statements must be covered
}
```

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open web/coverage/index.html
```

### Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| Vote Engine | 95% | ✅ Excellent |
| Civics | 85% | ✅ Good |
| Authentication | 80% | ✅ Good |
| PWA | 75% | ⚠️ Needs improvement |
| Admin | 50% | ❌ Needs tests |

---

## CI/CD Integration

### GitHub Actions Workflows

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests

### Workflow Jobs

1. **Quality** - Linting and type checking
2. **Unit Tests** - All Jest unit tests with coverage
3. **E2E Tests** - Playwright tests against built application
4. **Security** - Vulnerability scanning

### Artifacts

Test results and coverage reports are uploaded as artifacts:
- Coverage reports (30 days retention)
- Test results (30 days retention)
- Playwright reports (30 days retention)
- Screenshots on failure (30 days retention)

### Running Tests Locally (CI Mode)

```bash
# Simulate CI environment
npm run jest:ci

# Run full CI pipeline locally
npm run test:ci
```

---

## Debugging Tests

### Jest Tests

```bash
# Debug with Node inspector
npm run test:debug

# Then open: chrome://inspect in Chrome
# Click "inspect" on the remote target
```

### Playwright Tests

```bash
# Debug mode (step through tests)
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed

# UI mode (interactive)
npm run test:e2e:ui
```

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/web/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "cwd": "${workspaceFolder}/web"
}
```

### Common Debugging Tips

1. **Use `test.only()`** - Run single test
   ```typescript
   test.only('specific test', async () => { ... });
   ```

2. **Add console logs** - Debug output
   ```typescript
   console.log('Current state:', state);
   ```

3. **Take screenshots** - Visual debugging (Playwright)
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

4. **Slow down tests** - See what's happening
   ```typescript
   test.use({ slowMo: 1000 }); // 1 second delay between actions
   ```

---

## Best Practices

### General Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Avoid testing internal state

2. **AAA Pattern** (Arrange, Act, Assert)
   ```typescript
   // Arrange - Setup test data
   const input = createTestData();
   
   // Act - Execute the action
   const result = performAction(input);
   
   // Assert - Verify the result
   expect(result).toBe(expected);
   ```

3. **One Assertion Per Test** (when possible)
   - Makes failures easier to diagnose
   - Tests are more focused

4. **Independent Tests**
   - Tests should not depend on other tests
   - Each test should clean up after itself

5. **Descriptive Test Names**
   ```typescript
   // Good ✅
   test('should return error when email is invalid', ...)
   
   // Bad ❌
   test('email test', ...)
   ```

### Jest Best Practices

1. **Use `beforeEach` for setup**
   ```typescript
   beforeEach(() => {
     // Reset mocks
     jest.clearAllMocks();
   });
   ```

2. **Mock external dependencies**
   ```typescript
   jest.mock('@/lib/api');
   ```

3. **Use snapshots sparingly**
   - Good for complex UI structures
   - Update intentionally

4. **Test error cases**
   ```typescript
   expect(() => riskyFunction()).toThrow('Expected error');
   ```

### Playwright Best Practices

1. **Use page object models** for complex pages
2. **Wait for elements** before interacting
   ```typescript
   await page.waitForSelector('[data-testid="element"]');
   ```

3. **Use soft assertions** when checking multiple conditions
   ```typescript
   await expect.soft(element1).toBeVisible();
   await expect.soft(element2).toBeVisible();
   ```

4. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     await cleanupTestData();
   });
   ```

### What to Test

✅ **Do Test**:
- Public API/interface
- Error handling
- Edge cases
- User interactions
- Business logic
- Data validation

❌ **Don't Test**:
- External libraries (assume they work)
- Implementation details
- Constants
- Generated code

---

## Troubleshooting

### Common Issues

#### "jest-environment-jsdom not found"

```bash
# Install missing dependency
npm install --save-dev jest-environment-jsdom
```

#### "Tests timing out"

```bash
# Increase timeout in jest.config.cjs
testTimeout: 30000  // 30 seconds
```

#### "Playwright tests failing locally"

```bash
# Install Playwright browsers
npx playwright install --with-deps
```

#### "Module not found" errors

```bash
# Check module aliases in jest.config.cjs
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1'
}
```

#### "Cannot find gtimeout"

The project uses `gtimeout` (GNU timeout) for CI consistency. Locally, you can:
```bash
# macOS: Install coreutils
brew install coreutils

# Or use npm scripts without gtimeout
npm test  # Already uses npx without gtimeout
```

### Test Failures

1. **Check the error message** - Often indicates the issue
2. **Run in debug mode** - Step through the test
3. **Check test isolation** - Ensure tests are independent
4. **Verify mocks** - Ensure mocks match expected calls
5. **Check timing** - Add waits for async operations

### Getting Help

- Check existing tests for examples
- Review test documentation
- Ask team members
- Check CI logs for detailed errors

---

## Test Statistics

### Current Status

- **Total Tests**: 539+
  - Unit Tests: 232
  - E2E Tests: 307+
- **Coverage**: 75% overall
- **Pass Rate**: 100% (all tests passing)

### Test Execution Times

| Suite | Time |
|-------|------|
| Unit Tests | ~5-10 seconds |
| Integration Tests | ~15-30 seconds |
| E2E Tests | ~2-5 minutes |
| Full CI Pipeline | ~10-15 minutes |

---

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

### Test Utilities

- `web/tests/helpers/` - Custom test helpers
- `web/tests/fixtures/` - Test data fixtures
- `web/tests/setup.ts` - Global test setup

### Related Files

- `web/jest.config.cjs` - Jest configuration
- `web/playwright.config.ts` - Playwright configuration
- `.github/workflows/ci.yml` - CI/CD pipeline

---

## Contributing

When adding new features:

1. ✅ Write tests first (TDD approach recommended)
2. ✅ Ensure tests pass locally
3. ✅ Maintain coverage thresholds
4. ✅ Add test IDs to new components
5. ✅ Update this documentation if needed

---

**Last Updated**: November 2025  
**Maintained By**: Development Team

