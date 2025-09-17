import type { PostgrestSingleResponse } from '@supabase/supabase-js';

type Thenable<T> = { then: jest.Mock<any, any> }
type Single<T> = jest.Mock<Promise<PostgrestSingleResponse<T>>, any>

export function createMockSupabase() {
  const single: Single<any> = jest.fn().mockResolvedValue({ data: null, error: null } as any);
  const insert = jest.fn().mockResolvedValue({ data: null, error: null } as any);
  const update = jest.fn().mockResolvedValue({ data: null, error: null } as any);
  const thenable: Thenable<any> = { then: jest.fn().mockResolvedValue({ data: [], error: null }) };

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
