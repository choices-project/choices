/**
 * Email Mocking Utilities for E2E Tests
 * 
 * Provides utilities for mocking email functionality in tests
 */

export function setupEmailMocking() {
  // Mock email functionality for tests
  return {
    mockEmail: jest.fn(),
    clearEmailMocks: jest.fn(),
  };
}

export function createValidTestEmail() {
  return 'test@example.com';
}
