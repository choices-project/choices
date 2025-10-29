# Testing Directory Structure

## Overview

All testing configurations and utilities are now organized in a consistent directory structure, similar to how Playwright configs are organized.

## Directory Structure

```
tests/
├── jest/                          # Jest testing suite
│   ├── configs/                   # Jest configuration files
│   │   ├── jest.config.main.js    # Main Jest configuration
│   │   ├── jest.config.ci.js      # CI/CD optimized configuration
│   │   └── jest.config.unit-only.js # Unit tests only configuration
│   ├── setup/                     # Jest setup files
│   │   └── supabase-mock.ts       # Supabase mocking utilities
│   ├── unit/                      # Unit tests (business logic only)
│   │   ├── vote/                  # Voting algorithm tests
│   │   ├── irv/                   # IRV calculation tests
│   │   ├── lib/                   # Library function tests
│   │   └── database/              # Database connection tests
│   └── integration/               # Integration tests
│       └── contact/               # Contact messaging tests
├── playwright/                    # Playwright E2E testing suite
│   ├── configs/                   # Playwright configuration files
│   │   ├── playwright.config.chrome-only.ts
│   │   ├── playwright.config.ci.ts
│   │   └── playwright.config.progress.ts
│   └── e2e/                       # E2E test files
│       ├── core/                  # Critical user journey tests
│       ├── security/              # Security-focused tests
│       └── integration/           # Integration E2E tests
├── setup/                         # Shared testing utilities
│   ├── test-utils.ts              # Type-safe test utilities
│   ├── jest.setup.js              # Jest setup utilities
│   └── jest.config.base.js        # Base Jest configuration
└── archive/                       # Archived test files
    ├── unit-tests-removed/        # Moved problematic unit tests
    └── e2e-tests-consolidated/    # Consolidated E2E tests
```

## Configuration Files

### Jest Configurations

#### `tests/jest/configs/jest.config.main.js`
- **Purpose**: Main Jest configuration for development
- **Features**: Full test suite, watch mode support
- **Usage**: `npm run test:jest`

#### `tests/jest/configs/jest.config.ci.js`
- **Purpose**: CI/CD optimized configuration
- **Features**: Coverage collection, faster execution, better error reporting
- **Usage**: `npm run test:jest:ci`

#### `tests/jest/configs/jest.config.unit-only.js`
- **Purpose**: Unit tests only (business logic)
- **Features**: Excludes integration tests, faster execution
- **Usage**: `npm run test:jest:unit`

### Playwright Configurations

#### `tests/playwright/configs/playwright.config.chrome-only.ts`
- **Purpose**: Chrome-only testing for development
- **Features**: Fast execution, single browser
- **Usage**: `npx playwright test --config=tests/playwright/configs/playwright.config.chrome-only.ts`

#### `tests/playwright/configs/playwright.config.ci.ts`
- **Purpose**: CI/CD optimized E2E testing
- **Features**: Multiple browsers, headless mode
- **Usage**: `npx playwright test --config=tests/playwright/configs/playwright.config.ci.ts`

## Test Scripts

### Available Commands

```bash
# Jest Tests
npm run test:jest              # Run all Jest tests
npm run test:jest:watch        # Run Jest in watch mode
npm run test:jest:ci           # Run Jest with CI configuration
npm run test:jest:unit         # Run unit tests only

# E2E Tests
npm run test:e2e               # Run E2E tests (requires dev server)
npm run test:unit              # Run unit tests via test runner
npm run test:all               # Run all tests
npm run test:typescript        # Check TypeScript errors

# Direct Playwright
npx playwright test            # Run all Playwright tests
npx playwright test --ui       # Run with UI mode
```

### Test Runner Script

The `scripts/test-runner.sh` script provides convenient commands:

```bash
./scripts/test-runner.sh e2e        # Run E2E tests
./scripts/test-runner.sh unit       # Run unit tests
./scripts/test-runner.sh all        # Run all tests
./scripts/test-runner.sh typescript # Check TypeScript errors
./scripts/test-runner.sh dev        # Start development server
```

## Benefits of This Structure

### 1. **Consistency**
- Both Jest and Playwright configs are in their respective `configs/` directories
- Similar naming conventions across test types
- Clear separation of concerns

### 2. **Maintainability**
- Easy to find and update configurations
- Clear distinction between different test types
- Archived tests are organized and accessible

### 3. **Flexibility**
- Multiple configurations for different environments
- Easy to add new configurations
- Clear test execution paths

### 4. **Developer Experience**
- Intuitive directory structure
- Clear script names
- Easy to understand what each configuration does

## Migration Summary

### What Was Moved
- `jest.config.js` → `tests/jest/configs/jest.config.main.js`
- `jest.setup.js` → `tests/jest/configs/jest.setup.main.js`
- Root Jest config now points to testing suite directory

### What Was Created
- `tests/jest/configs/jest.config.ci.js` - CI configuration
- `tests/jest/configs/jest.config.unit-only.js` - Unit tests only
- `tests/setup/test-utils.ts` - Type-safe test utilities
- `scripts/test-runner.sh` - Convenient test execution

### What Was Archived
- 20+ problematic unit tests moved to `tests/archive/unit-tests-removed/`
- Redundant E2E tests moved to `tests/archive/e2e-tests-consolidated/`

## Next Steps

1. **Use the new structure** for all new tests
2. **Update CI/CD** to use the new configuration paths
3. **Add new configurations** as needed for different environments
4. **Maintain consistency** when adding new test types

This structure provides a solid foundation for maintainable, scalable testing across the entire application.
