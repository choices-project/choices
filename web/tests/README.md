# Testing Infrastructure

## Overview
This directory contains all testing infrastructure for the Choices platform. All tests are consolidated here to avoid the previous dual testing infrastructure issue.

## Directory Structure
```
web/tests/
├── playwright/
│   ├── configs/           # Playwright configuration files
│   ├── e2e/               # End-to-end tests
│   │   ├── core/          # Core functionality tests
│   │   ├── resilience/    # Resilience and failover tests
│   │   └── features/      # Feature-specific tests
│   └── utils/             # Playwright utilities
├── jest/                  # Unit and integration tests
├── utils/                 # Shared testing utilities
└── README.md             # This file
```

## Test Output Structure
All test outputs are centralized in `/web/test-results/`:

```
web/test-results/
├── journey/               # User journey test results
├── reports/               # Database analysis reports
├── monitoring/           # Performance monitoring data
└── playwright/           # Playwright test results
```

## Configuration Files
- **Playwright Configs**: Located in `/web/tests/playwright/configs/`
- **Jest Configs**: Located in `/web/tests/jest/`
- **Root Config**: `/playwright.resilience.config.ts` (points to web/tests)

## Running Tests

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:user-journey-stage-4
npm run test:admin-journey-stage-4
```

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

## Database Tracking
The `DatabaseTracker` utility automatically tracks database table usage during E2E tests to identify which tables are actively used by the application.

## Test Results
All test results are automatically saved to the centralized `/web/test-results/` directory with organized subdirectories for different types of outputs.

## Created
January 27, 2025

## Updated
January 27, 2025