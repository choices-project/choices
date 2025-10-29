# Testing Strategy

## Philosophy: E2E-First Testing

### Primary Focus: End-to-End Tests
- **Why**: Tests real user journeys and catches integration issues
- **Coverage**: Critical user flows (auth, polls, profiles, etc.)
- **Maintenance**: Lower maintenance burden than unit tests
- **Value**: Tests what users actually experience

### Secondary: Strategic Unit Tests
- **What to test**: Pure functions, utilities, business logic
- **What NOT to test**: React components, UI implementation details
- **Why**: Components change frequently, unit tests become brittle

## Current E2E Test Coverage

### ✅ Authentication & Security (8 tests)
- Login/logout flows
- Protected route redirects
- Session management
- Security headers

### ✅ Core User Journeys
- Poll creation and voting
- Profile management
- Dashboard functionality
- API endpoints

## Recommended Testing Pyramid

```
    /\
   /  \     E2E Tests (70%)
  /____\    - User journeys
 /      \   - Integration flows
/________\  - Critical paths

    /\
   /  \     Unit Tests (20%)
  /____\    - Pure functions
 /      \   - Business logic
/________\  - Utilities

    /\
   /  \     Integration Tests (10%)
  /____\    - API contracts
 /      \   - Database operations
/________\  - External services
```

## Test File Organization

```
tests/
├── playwright/           # E2E tests (primary)
│   ├── e2e/
│   │   ├── auth/
│   │   ├── polls/
│   │   └── profiles/
│   └── configs/
├── jest/                 # Unit tests (minimal)
│   ├── unit/
│   │   ├── utils/        # Pure functions only
│   │   └── lib/          # Business logic only
│   └── integration/      # API tests
└── setup/               # Test utilities
    ├── test-utils.ts
    └── jest.config.base.js
```

## Type-Safe Testing Foundation

### New Test Files Should Use:
```typescript
import { createTypedMock, mockFeatureFlags } from '@/tests/setup/test-utils';

// Type-safe mocks
const mockFlags = mockFeatureFlags();
const mockUser = createMockUser({ email: 'test@example.com' });
```

### Avoid:
- Manual `jest.fn()` without proper typing
- Testing implementation details
- Over-mocking components

## Maintenance Strategy

### E2E Tests
- **Update when**: User flows change
- **Maintenance**: Low (test user behavior, not implementation)
- **Value**: High (catches real issues)

### Unit Tests
- **Update when**: Business logic changes
- **Maintenance**: Medium (test contracts, not implementation)
- **Value**: Medium (catches logic errors)

## Future Test Creation Guidelines

### ✅ DO Test
- User authentication flows
- Poll creation and voting
- Profile management
- API endpoint contracts
- Pure utility functions
- Business logic functions

### ❌ DON'T Test
- React component rendering details
- Internal state management
- CSS styling
- Implementation-specific behavior
- Over-mocked integration points

## Current Status

- **E2E Tests**: 8 passing, covering critical user journeys
- **Unit Tests**: 454 TypeScript errors (focus on fixing infrastructure, not individual tests)
- **Next Steps**: Expand E2E coverage, clean up unit test infrastructure
