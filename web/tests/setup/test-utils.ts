/**
 * Test Utilities and Type-Safe Mocks
 * Provides type-safe mocking utilities to prevent future TypeScript errors
 */

import { jest } from '@jest/globals';

// Type-safe mock factory
export function createTypedMock<T extends Record<string, any>>(defaults: Partial<T> = {}): T {
  return new Proxy({} as T, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop in defaults) return defaults[prop];
      return jest.fn() as any;
    }
  });
}

// Common mock patterns
export const mockFeatureFlags = () => createTypedMock({
  isEnabled: jest.fn().mockReturnValue(true),
  isLoading: false,
  error: null,
  flags: {},
  fetchFlags: jest.fn().mockResolvedValue(undefined),
  setFeatureFlag: jest.fn().mockResolvedValue(undefined),
  toggleFeatureFlag: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
  getAllFlags: jest.fn().mockReturnValue(new Map()),
  getEnabledFlags: jest.fn().mockReturnValue([]),
  getDisabledFlags: jest.fn().mockReturnValue([]),
  getFlagsByCategory: jest.fn().mockReturnValue([]),
  getSystemInfo: jest.fn().mockReturnValue({
    totalFlags: 0,
    enabledFlags: 0,
    disabledFlags: 0,
    environment: 'test',
    categories: {}
  }),
  areDependenciesEnabled: jest.fn().mockReturnValue(true),
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
});

export const mockSupabaseClient = () => createTypedMock({
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    })
  })
});

// Jest DOM setup
export const setupJestDOM = () => {
  // This ensures all Jest DOM matchers are available
  require('@testing-library/jest-dom');
};

// Test data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockPoll = (overrides: Partial<any> = {}) => ({
  id: 'test-poll-123',
  title: 'Test Poll',
  description: 'Test Description',
  created_by: 'test-user-123',
  is_public: true,
  created_at: new Date().toISOString(),
  ...overrides
});
