# 🧪 Testing Guide

**Complete Testing Documentation for Choices Platform**

---

## 🎯 **Overview**

The Choices platform features a comprehensive testing suite designed for solo development, focusing on practical testing strategies that ensure code quality and system reliability without overwhelming complexity.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Testing Strategy**: Pragmatic Solo Development

---

## 🏗️ **Testing Architecture**

### **Testing Philosophy**
- **Pragmatic Approach**: Focus on what matters most
- **Solo Developer Optimized**: Efficient testing for individual development
- **Quality Assurance**: Ensure code quality and system reliability
- **Maintenance Friendly**: Easy to maintain and update tests

### **Testing Pyramid**
```
    🔺 E2E Tests (Playwright)
   🔺🔺 Integration Tests (Jest)
  🔺🔺🔺 Unit Tests (Jest)
```

### **Testing Tools**
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Testing Library**: Component testing utilities
- **MSW**: API mocking for tests

---

## 🔧 **Testing Setup**

### **Jest Configuration**
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'features/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### **Playwright Configuration**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🧪 **Unit Testing**

### **Component Testing**
```typescript
// tests/jest/components/PollCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PollCard } from '@/components/business/PollCard';

const mockPoll = {
  id: 'poll-123',
  title: 'Test Poll',
  description: 'A test poll description',
  options: [
    { id: 'opt-1', text: 'Option A', votes: 10 },
    { id: 'opt-2', text: 'Option B', votes: 15 }
  ],
  total_votes: 25,
  created_at: '2025-10-27T12:00:00Z',
  status: 'active'
};

describe('PollCard Component', () => {
  it('renders poll information correctly', () => {
    render(<PollCard poll={mockPoll} />);
    
    expect(screen.getByText('Test Poll')).toBeInTheDocument();
    expect(screen.getByText('A test poll description')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });
  
  it('displays vote counts correctly', () => {
    render(<PollCard poll={mockPoll} />);
    
    expect(screen.getByText('10 votes')).toBeInTheDocument();
    expect(screen.getByText('15 votes')).toBeInTheDocument();
  });
  
  it('handles vote button clicks', () => {
    const mockOnVote = jest.fn();
    render(<PollCard poll={mockPoll} onVote={mockOnVote} />);
    
    const voteButton = screen.getByText('Vote');
    fireEvent.click(voteButton);
    
    expect(mockOnVote).toHaveBeenCalledWith('poll-123');
  });
});
```

### **Hook Testing**
```typescript
// tests/jest/hooks/usePollWizard.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePollWizard } from '@/features/polls/hooks/usePollWizard';

describe('usePollWizard Hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => usePollWizard());
    
    expect(result.current.step).toBe(1);
    expect(result.current.pollData).toEqual({
      title: '',
      description: '',
      options: [],
      privacy_level: 'public',
      poll_type: 'single_choice'
    });
  });
  
  it('updates poll data correctly', () => {
    const { result } = renderHook(() => usePollWizard());
    
    act(() => {
      result.current.updatePollData({ title: 'New Poll Title' });
    });
    
    expect(result.current.pollData.title).toBe('New Poll Title');
  });
  
  it('navigates between steps correctly', () => {
    const { result } = renderHook(() => usePollWizard());
    
    act(() => {
      result.current.nextStep();
    });
    
    expect(result.current.step).toBe(2);
    
    act(() => {
      result.current.previousStep();
    });
    
    expect(result.current.step).toBe(1);
  });
});
```

### **Utility Function Testing**
```typescript
// tests/jest/utils/analytics.test.ts
import { calculatePollResults, applyDifferentialPrivacy } from '@/lib/utils/analytics';

describe('Analytics Utilities', () => {
  describe('calculatePollResults', () => {
    it('calculates poll results correctly', () => {
      const options = [
        { id: 'opt-1', text: 'Option A' },
        { id: 'opt-2', text: 'Option B' }
      ];
      
      const votes = [
        { option_id: 'opt-1', user_id: 'user-1' },
        { option_id: 'opt-1', user_id: 'user-2' },
        { option_id: 'opt-2', user_id: 'user-3' }
      ];
      
      const results = calculatePollResults(options, votes);
      
      expect(results[0].votes).toBe(2);
      expect(results[0].percentage).toBe(66.67);
      expect(results[1].votes).toBe(1);
      expect(results[1].percentage).toBe(33.33);
    });
  });
  
  describe('applyDifferentialPrivacy', () => {
    it('applies differential privacy correctly', () => {
      const results = [
        { option_id: 'opt-1', votes: 10, percentage: 50 },
        { option_id: 'opt-2', votes: 10, percentage: 50 }
      ];
      
      const privateResults = applyDifferentialPrivacy(results, 1.0);
      
      // Results should be modified but still valid
      expect(privateResults).toHaveLength(2);
      expect(privateResults[0].votes).toBeGreaterThanOrEqual(0);
      expect(privateResults[1].votes).toBeGreaterThanOrEqual(0);
    });
  });
});
```

---

## 🔗 **Integration Testing**

### **API Route Testing**
```typescript
// tests/jest/api/polls.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/polls/route';

describe('/api/polls', () => {
  it('creates a poll successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Test Poll',
        description: 'A test poll',
        options: [
          { text: 'Option A' },
          { text: 'Option B' }
        ],
        privacy_level: 'public',
        poll_type: 'single_choice'
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.poll.title).toBe('Test Poll');
    expect(data.poll.options).toHaveLength(2);
  });
  
  it('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: '',
        options: []
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toContain('validation');
  });
});
```

### **Database Integration Testing**
```typescript
// tests/jest/integration/database.test.ts
import { supabase } from '@/lib/supabase/client';

describe('Database Integration', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('test_polls').delete().neq('id', '');
  });
  
  it('creates and retrieves polls', async () => {
    // Create test poll
    const { data: poll, error: createError } = await supabase
      .from('polls')
      .insert({
        title: 'Test Poll',
        description: 'Test Description',
        options: [
          { id: 'opt-1', text: 'Option A' },
          { id: 'opt-2', text: 'Option B' }
        ],
        privacy_level: 'public',
        poll_type: 'single_choice'
      })
      .select()
      .single();
    
    expect(createError).toBeNull();
    expect(poll).toBeDefined();
    
    // Retrieve poll
    const { data: retrievedPoll, error: retrieveError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', poll.id)
      .single();
    
    expect(retrieveError).toBeNull();
    expect(retrievedPoll.title).toBe('Test Poll');
  });
  
  it('handles RLS policies correctly', async () => {
    // Test that users can only access their own data
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'other-user-id');
    
    // Should be empty due to RLS
    expect(data).toEqual([]);
    expect(error).toBeNull();
  });
});
```

---

## 🎭 **End-to-End Testing**

### **User Journey Testing**
```typescript
// tests/playwright/e2e/core/user-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Journey Tests', () => {
  test('complete poll creation and voting flow', async ({ page }) => {
    // Navigate to poll creation
    await page.goto('/polls/create');
    
    // Fill out poll form
    await page.fill('[data-testid="poll-title-input"]', 'E2E Test Poll');
    await page.fill('[data-testid="poll-description-input"]', 'This is an E2E test poll');
    
    // Add options
    await page.fill('[data-testid="poll-option-input-0"]', 'Option A');
    await page.fill('[data-testid="poll-option-input-1"]', 'Option B');
    
    // Submit poll
    await page.click('[data-testid="poll-submit-button"]');
    
    // Wait for redirect to poll page
    await page.waitForURL(/\/polls\/[a-zA-Z0-9-]+/);
    
    // Verify poll is displayed
    await expect(page.locator('[data-testid="poll-title"]')).toContainText('E2E Test Poll');
    await expect(page.locator('[data-testid="poll-option"]')).toHaveCount(2);
    
    // Vote on poll
    await page.click('[data-testid="vote-button-0"]');
    
    // Verify vote was recorded
    await expect(page.locator('[data-testid="vote-success-message"]')).toBeVisible();
  });
  
  test('authentication flow', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    
    // Try to access protected page
    await page.goto('/dashboard');
    
    // Should be redirected to auth
    await expect(page).toHaveURL(/\/auth/);
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

### **Cross-Browser Testing**
```typescript
// tests/playwright/e2e/core/cross-browser.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('poll creation works across browsers', async ({ page, browserName }) => {
    await page.goto('/polls/create');
    
    // Test form functionality
    await page.fill('[data-testid="poll-title-input"]', `Test Poll - ${browserName}`);
    await page.fill('[data-testid="poll-description-input"]', 'Cross-browser test');
    
    // Test option addition
    await page.fill('[data-testid="poll-option-input-0"]', 'Option A');
    await page.click('[data-testid="add-option-button"]');
    await page.fill('[data-testid="poll-option-input-1"]', 'Option B');
    
    // Submit poll
    await page.click('[data-testid="poll-submit-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-title"]')).toContainText(`Test Poll - ${browserName}`);
  });
  
  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test mobile poll creation
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Mobile Test Poll');
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="poll-form"]')).toBeVisible();
  });
});
```

---

## 🔍 **Testing Utilities**

### **Test Data Management**
```typescript
// tests/helpers/test-data.ts
export const createTestUser = async (overrides: Partial<User> = {}) => {
  const userData = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    trust_tier: 'new',
    ...overrides
  };
  
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createTestPoll = async (overrides: Partial<Poll> = {}) => {
  const pollData = {
    title: `Test Poll ${Date.now()}`,
    description: 'A test poll',
    options: [
      { id: 'opt-1', text: 'Option A' },
      { id: 'opt-2', text: 'Option B' }
    ],
    privacy_level: 'public',
    poll_type: 'single_choice',
    ...overrides
  };
  
  const { data, error } = await supabase
    .from('polls')
    .insert(pollData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createTestVote = async (pollId: string, optionId: string, userId?: string) => {
  const voteData = {
    poll_id: pollId,
    option_id: optionId,
    user_id: userId,
    anonymous: !userId
  };
  
  const { data, error } = await supabase
    .from('votes')
    .insert(voteData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

### **Mock Services**
```typescript
// tests/helpers/mocks.ts
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  })),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  }
};

export const mockAnalyticsService = {
  trackEvent: jest.fn().mockResolvedValue(undefined),
  getAnalytics: jest.fn().mockResolvedValue({}),
  generateInsights: jest.fn().mockResolvedValue({})
};
```

---

## 📊 **Test Coverage**

### **Coverage Goals**
- **Unit Tests**: 80%+ coverage for utilities and hooks
- **Component Tests**: 70%+ coverage for React components
- **Integration Tests**: 60%+ coverage for API routes
- **E2E Tests**: Critical user journeys covered

### **Coverage Reporting**
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### **Coverage Configuration**
```javascript
// jest.config.js coverage settings
collectCoverageFrom: [
  'components/**/*.{js,jsx,ts,tsx}',
  'features/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  'app/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/tests/**',
  '!**/coverage/**'
],
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
  './lib/utils/': {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  }
}
```

---

## 🚀 **Testing Commands**

### **Development Commands**
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- PollCard.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="PollCard"
```

### **E2E Testing Commands**
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run E2E tests for specific browser
npm run test:e2e -- --project=chromium

# Run E2E tests with debug
npm run test:e2e:debug
```

### **CI/CD Commands**
```bash
# Run tests for CI
npm run test:ci

# Run E2E tests for CI
npm run test:e2e:ci

# Generate test reports
npm run test:report
```

---

## 🔧 **Testing Best Practices**

### **Test Organization**
- **Group Related Tests**: Use `describe` blocks for logical grouping
- **Clear Test Names**: Use descriptive test names that explain what's being tested
- **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
- **One Concept Per Test**: Test one concept or behavior per test

### **Test Data Management**
- **Isolated Test Data**: Use unique test data for each test
- **Cleanup After Tests**: Clean up test data after each test
- **Realistic Test Data**: Use realistic data that matches production
- **Test Data Factories**: Use factory functions for creating test data

### **Mocking Strategy**
- **Mock External Dependencies**: Mock external APIs and services
- **Don't Mock Everything**: Test real implementations when possible
- **Mock at Boundaries**: Mock at the boundaries of your system
- **Verify Mock Calls**: Verify that mocks are called correctly

### **E2E Testing Strategy**
- **Test Critical Paths**: Focus on critical user journeys
- **Stable Selectors**: Use stable, semantic selectors for elements
- **Wait for Elements**: Use proper waiting strategies
- **Test Across Browsers**: Test on multiple browsers and devices

---

## 🐛 **Debugging Tests**

### **Jest Debugging**
```bash
# Run tests with debug output
npm run test -- --verbose

# Run specific test with debug
npm run test -- --testNamePattern="PollCard" --verbose

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### **Playwright Debugging**
```bash
# Run tests in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test user-journey.spec.ts --debug

# Generate trace files
npx playwright test --trace on
```

### **Common Issues**
- **Async/Await**: Ensure proper async/await usage in tests
- **Timing Issues**: Use proper waiting strategies in E2E tests
- **Mock Cleanup**: Clean up mocks between tests
- **Test Isolation**: Ensure tests don't depend on each other

---

## 📈 **Test Performance**

### **Optimization Strategies**
- **Parallel Execution**: Run tests in parallel when possible
- **Test Selection**: Run only relevant tests during development
- **Mock Heavy Operations**: Mock slow operations in tests
- **Efficient Selectors**: Use efficient selectors in E2E tests

### **Performance Monitoring**
```bash
# Measure test performance
npm run test -- --verbose --detectOpenHandles

# Profile test execution
npm run test -- --profile
```

---

## 🎯 **Testing Checklist**

### **Before Committing**
- [ ] All tests pass locally
- [ ] New code has appropriate test coverage
- [ ] E2E tests cover critical user journeys
- [ ] Test data is properly cleaned up
- [ ] Mocks are properly configured

### **Regular Maintenance**
- [ ] Review and update test data
- [ ] Update tests when features change
- [ ] Monitor test performance
- [ ] Review test coverage reports
- [ ] Update testing dependencies

---

**Testing Documentation Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This testing documentation provides complete coverage of the Choices platform testing strategy and implementation.*
