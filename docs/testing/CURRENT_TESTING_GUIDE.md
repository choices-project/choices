# Current Testing Guide

## Overview

This guide reflects the current testing state of the Choices platform as of August 30, 2025. Our testing philosophy focuses on **meaningful tests that identify development gaps** rather than testing for the sake of testing.

## Testing Philosophy

- **Test for intended functionality**: Write tests that describe how the system SHOULD work
- **Identify gaps**: Use test failures to identify what needs to be built or fixed
- **Meaningful coverage**: Focus on critical user journeys and business logic
- **Real-world scenarios**: Test actual user workflows, not isolated components

## Current Test Structure

### E2E Tests (`web/tests/e2e/`)
- **`current-system-e2e.test.ts`**: Tests current system functionality
  - Homepage content and navigation
  - User registration flow
  - Login flow
  - Onboarding process
  - Profile page accessibility
  - Polls page functionality
  - Dashboard access control
  - Error handling
  - Performance benchmarks
  - Responsive design
  - API endpoint accessibility

### Unit Tests (`web/__tests__/`)

#### Authentication Tests
- **`auth/useAuth.test.tsx`**: Tests for the current hooks-based authentication system
  - Authentication state management
  - Login/logout functionality
  - Error handling
  - Context provider behavior

- **`auth/biometric-auth.test.tsx`**: Tests for biometric authentication
  - BiometricSetup component
  - WebAuthn API integration
  - Registration and login flows
  - Error handling for unsupported browsers

#### Component Tests
- **`components/polls/EnhancedVoteForm.test.tsx`**: Voting functionality
  - Form validation
  - Single vs. multiple choice voting
  - Offline support
  - Error handling

#### API Tests
- **`api/`**: API route testing
- **`actions/`**: Server action testing
- **`utils/`**: Utility function testing

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- useAuth.test.tsx
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug
```

### Type Checking
```bash
# TypeScript type checking
npm run type-check

# Strict type checking
npm run type-check:strict
```

### Linting
```bash
# ESLint checking
npm run lint

# Lint with no warnings allowed
npm run lint:strict
```

## Current Test Status

### ✅ Working Tests
- Basic authentication flow tests
- Component rendering tests
- API endpoint accessibility tests
- Error handling tests
- Performance benchmarks

### ⚠️ Tests That May Fail (Expected)
- **Homepage stats**: May fail if API endpoints aren't working
- **Registration flow**: May fail if backend isn't fully configured
- **Login flow**: May fail with invalid credentials (expected behavior)
- **Protected routes**: May redirect to login (expected behavior)

### 🔧 Tests That Need Updates
- **Component tests**: Some may need updates for current component structure
- **API tests**: May need updates for current API endpoints
- **Mock configurations**: May need updates for current dependencies

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest preset
- Tests in `jsdom` environment
- Includes custom matchers from `@testing-library/jest-dom`
- 30-second timeout for database tests
- Coverage collection from `lib/`, `components/`, and `app/` directories

### Jest Setup (`jest.setup.js`)
- Imports `@testing-library/jest-dom` matchers
- Sets up test environment variables
- Mocks Supabase client
- Mocks auth service
- Mocks Next.js components and APIs
- Mocks browser APIs (crypto, navigator, etc.)

### Playwright Configuration (`playwright.config.ts`)
- Tests against local development server
- Uses Chromium browser
- Includes screenshot and video capture on failure
- Configurable timeouts and retries

## Testing Best Practices

### Unit Tests
1. **Test behavior, not implementation**: Focus on what the code does, not how it does it
2. **Use meaningful assertions**: Test for business logic, not just that functions are called
3. **Mock external dependencies**: Don't test third-party libraries
4. **Test error conditions**: Ensure error handling works correctly
5. **Keep tests focused**: One assertion per test when possible

### E2E Tests
1. **Test user journeys**: Focus on complete workflows, not isolated features
2. **Use realistic data**: Test with data that represents real usage
3. **Handle async operations**: Use proper waiting strategies
4. **Test across browsers**: Ensure cross-browser compatibility
5. **Include accessibility tests**: Test keyboard navigation and screen readers

### Test Data Management
1. **Use factories**: Create test data using factory functions
2. **Clean up after tests**: Ensure tests don't leave data behind
3. **Use unique identifiers**: Avoid conflicts between test runs
4. **Mock external services**: Don't depend on external APIs in tests

## Common Test Patterns

### Testing React Components
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    render(<ComponentName />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument()
    })
  })
})
```

### Testing API Routes
```typescript
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('API Route', () => {
  it('should handle valid requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

### Testing Authentication
```typescript
import { useAuth } from '@/hooks/useAuth'
import { AuthProvider } from '@/hooks/AuthProvider'

const TestComponent = () => {
  const { user, isAuthenticated, login } = useAuth()
  return (
    <div>
      <span data-testid="status">
        {isAuthenticated ? 'Logged in' : 'Not logged in'}
      </span>
      <button onClick={() => login({ email: 'test@example.com', password: 'test' })}>
        Login
      </button>
    </div>
  )
}

describe('Authentication', () => {
  it('should handle login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Logged in')
    })
  })
})
```

## Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` for async operations
2. **Mock setup**: Ensure mocks are properly configured
3. **Environment variables**: Check that test environment is set up correctly
4. **Component dependencies**: Ensure all required providers are wrapped

### Debugging Commands
```bash
# Run specific test with verbose output
npm test -- --verbose useAuth.test.tsx

# Run tests with debugger
npm test -- --inspect-brk

# Run E2E tests with debug mode
npm run test:e2e:debug

# Run tests with coverage and open report
npm run test:coverage && open coverage/lcov-report/index.html
```

## Continuous Integration

### GitHub Actions
Tests are automatically run on:
- Pull requests
- Pushes to main branch
- Manual workflow triggers

### Pre-commit Hooks
Consider adding pre-commit hooks to:
- Run linting
- Run type checking
- Run unit tests
- Run E2E tests (optional, may be slow)

## Future Testing Improvements

### Planned Enhancements
1. **Integration tests**: Test database interactions
2. **Performance tests**: Measure and track performance metrics
3. **Security tests**: Test authentication and authorization
4. **Accessibility tests**: Ensure WCAG compliance
5. **Visual regression tests**: Detect UI changes

### Test Coverage Goals
- **Unit tests**: 80%+ coverage for business logic
- **E2E tests**: Cover all critical user journeys
- **Integration tests**: Test all API endpoints
- **Performance tests**: Ensure sub-3-second page loads

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)

---

**Last Updated**: August 30, 2025
**Status**: Current and maintained
