/**
 * Jest Setup
 * Global test configuration and utilities
 */

import { setupJestDOM } from './test-utils';

// Setup Jest DOM matchers
setupJestDOM();

// Global test utilities
global.createTypedMock = require('./test-utils').createTypedMock;
global.mockFeatureFlags = require('./test-utils').mockFeatureFlags;
global.mockSupabaseClient = require('./test-utils').mockSupabaseClient;

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
