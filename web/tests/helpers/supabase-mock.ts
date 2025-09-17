/**
 * Unified Supabase mock factory for consistent testing
 * 
 * This module provides standardized mock objects for Supabase client operations,
 * eliminating the need for bespoke mocks and resolving type safety issues in tests.
 * 
 * @fileoverview Standardized Supabase testing utilities
 */

import type { 
  SupabaseClient, 
  PostgrestSingleResponse, 
  PostgrestError,
  PostgrestResponse,
  RealtimeChannel
} from '@supabase/supabase-js';

/**
 * Create a successful single response
 */
export function okSingle<T>(data: T): PostgrestSingleResponse<T> {
  return { 
    data, 
    error: null, 
    count: null, 
    status: 200, 
    statusText: 'OK' 
  };
}

/**
 * Create an error single response
 */
export function errSingle(msg: string, code = 'PGRST'): PostgrestSingleResponse<null> {
  const error: PostgrestError = { 
    message: msg, 
    details: '', 
    hint: '', 
    code 
  };
  return { 
    data: null, 
    error, 
    count: null, 
    status: 400, 
    statusText: 'Bad Request' 
  };
}

/**
 * Create a successful array response
 */
export function okArray<T>(data: T[]): PostgrestResponse<T[]> {
  return { 
    data, 
    error: null, 
    count: data.length, 
    status: 200, 
    statusText: 'OK' 
  };
}

/**
 * Create an error array response
 */
export function errArray(msg: string, code = 'PGRST'): PostgrestResponse<null> {
  const error: PostgrestError = { 
    message: msg, 
    details: '', 
    hint: '', 
    code 
  };
  return { 
    data: null, 
    error, 
    count: null, 
    status: 400, 
    statusText: 'Bad Request' 
  };
}

/**
 * Mock channel for realtime subscriptions
 */
export function createMockChannel(): jest.Mocked<RealtimeChannel> {
  return {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnThis(),
    send: jest.fn(),
    track: jest.fn().mockReturnThis(),
    untrack: jest.fn().mockReturnThis(),
    timeout: jest.fn().mockReturnThis(),
    setAuth: jest.fn().mockReturnThis(),
  } as jest.Mocked<RealtimeChannel>;
}

/**
 * Create a complete mock Supabase client
 */
export function makeMockSupabase(): {
  client: jest.Mocked<SupabaseClient<any, 'public', any>>;
  single: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  in: jest.Mock;
  is: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
  from: jest.Mock;
  channel: jest.Mock;
} {
  // Mock query builder methods
  const single = jest.fn();
  const select = jest.fn().mockReturnThis();
  const insert = jest.fn().mockReturnThis();
  const update = jest.fn().mockReturnThis();
  const deleteMethod = jest.fn().mockReturnThis();
  const eq = jest.fn().mockReturnThis();
  const gte = jest.fn().mockReturnThis();
  const lte = jest.fn().mockReturnThis();
  const inMethod = jest.fn().mockReturnThis();
  const is = jest.fn().mockReturnThis();
  const like = jest.fn().mockReturnThis();
  const ilike = jest.fn().mockReturnThis();
  const order = jest.fn().mockReturnThis();
  const limit = jest.fn().mockReturnThis();
  const range = jest.fn().mockReturnThis();

  // Mock query builder object
  const queryBuilder = {
    select,
    insert,
    update,
    delete: deleteMethod,
    eq,
    gte,
    lte,
    in: inMethod,
    is,
    like,
    ilike,
    order,
    limit,
    range,
    single,
    then: jest.fn(),
  };

  // Mock from method to return query builder
  const from = jest.fn(() => queryBuilder);

  // Mock channel method
  const channel = jest.fn(() => createMockChannel());

  // Create the mock client
  const client = {
    from,
    channel,
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    storage: {
      from: jest.fn(),
    },
    realtime: {
      channel: jest.fn(() => createMockChannel()),
    },
  } as jest.Mocked<SupabaseClient<any, 'public', any>>;

  return {
    client,
    single,
    select,
    insert,
    update,
    delete: deleteMethod,
    eq,
    gte,
    lte,
    in: inMethod,
    is,
    like,
    ilike,
    order,
    limit,
    range,
    from,
    channel,
  };
}

/**
 * Create a mock Supabase client with predefined responses
 */
export function makeMockSupabaseWithResponses<T>(responses: {
  single?: PostgrestSingleResponse<T>;
  select?: PostgrestResponse<T[]>;
  insert?: PostgrestResponse<T>;
  update?: PostgrestResponse<T>;
  delete?: PostgrestResponse<T>;
}): jest.Mocked<SupabaseClient<any, 'public', any>> {
  const { client, single, select, insert, update, delete: deleteMethod } = makeMockSupabase();

  // Set up predefined responses
  if (responses.single) {
    single.mockResolvedValue(responses.single);
  }
  if (responses.select) {
    select.mockResolvedValue(responses.select);
  }
  if (responses.insert) {
    insert.mockResolvedValue(responses.insert);
  }
  if (responses.update) {
    update.mockResolvedValue(responses.update);
  }
  if (responses.delete) {
    deleteMethod.mockResolvedValue(responses.delete);
  }

  return client;
}

/**
 * Common test data factories
 */
export const TestData = {
  /**
   * Create a mock user object
   */
  user: (overrides: Partial<any> = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  /**
   * Create a mock poll object
   */
  poll: (overrides: Partial<any> = {}) => ({
    id: 'test-poll-id',
    title: 'Test Poll',
    description: 'Test Description',
    created_at: '2024-01-01T00:00:00Z',
    user_id: 'test-user-id',
    ...overrides,
  }),

  /**
   * Create a mock vote object
   */
  vote: (overrides: Partial<any> = {}) => ({
    id: 'test-vote-id',
    poll_id: 'test-poll-id',
    user_id: 'test-user-id',
    option_id: 'test-option-id',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),

  /**
   * Create a mock option object
   */
  option: (overrides: Partial<any> = {}) => ({
    id: 'test-option-id',
    poll_id: 'test-poll-id',
    text: 'Test Option',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
} as const;

/**
 * Common error scenarios for testing
 */
export const TestErrors = {
  /**
   * Network error
   */
  network: () => errSingle('Network error', 'NETWORK_ERROR'),
  
  /**
   * Authentication error
   */
  auth: () => errSingle('Authentication required', 'AUTH_REQUIRED'),
  
  /**
   * Permission error
   */
  permission: () => errSingle('Insufficient permissions', 'PERMISSION_DENIED'),
  
  /**
   * Not found error
   */
  notFound: () => errSingle('Resource not found', 'NOT_FOUND'),
  
  /**
   * Validation error
   */
  validation: () => errSingle('Validation failed', 'VALIDATION_ERROR'),
} as const;

/**
 * Utility to reset all mocks
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
}

/**
 * Utility to verify mock calls
 */
export function verifyMockCalls(mock: jest.Mock, expectedCalls: number): void {
  expect(mock).toHaveBeenCalledTimes(expectedCalls);
}

/**
 * Utility to verify mock call arguments
 */
export function verifyMockCallArgs(
  mock: jest.Mock, 
  callIndex: number, 
  expectedArgs: unknown[]
): void {
  expect(mock).toHaveBeenNthCalledWith(callIndex + 1, ...expectedArgs);
}