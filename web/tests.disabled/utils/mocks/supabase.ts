import type { PostgrestSingleResponse, PostgrestError } from '@supabase/supabase-js';

type Thenable<_T> = { then: jest.Mock<any, any> }
type Single<T> = jest.Mock<Promise<PostgrestSingleResponse<T>>, any>

// Helper to create proper PostgrestSingleResponse
function createSuccessResponse<T>(data: T): PostgrestSingleResponse<T> {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: "OK"
  };
}

// Helper to create proper PostgrestError
function createErrorResponse(message: string): PostgrestError {
  return {
    message,
    details: "",
    hint: "",
    code: "",
    name: "PostgrestError"
  };
}

export function createMockSupabase() {
  const single: Single<any> = jest.fn().mockResolvedValue(createSuccessResponse(null));
  const insert = jest.fn().mockResolvedValue(createSuccessResponse(null));
  const update = jest.fn().mockResolvedValue(createSuccessResponse(null));
  const thenable: Thenable<any> = { then: jest.fn().mockResolvedValue(createSuccessResponse([])) };

  const from = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single,
    ...thenable
  }));

  const channel = jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnThis(),
    send: jest.fn().mockResolvedValue(undefined as void)
  }));

  return { from, channel, single, insert, update, thenable };
}

// Export helper functions for use in tests
export { createSuccessResponse, createErrorResponse };
