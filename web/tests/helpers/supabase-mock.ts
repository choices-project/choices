import type { SupabaseClient, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

type Any = any; // explicit to avoid creeping implicit 'any' in tests

export const okSingle = <T>(data: T): PostgrestSingleResponse<T> => ({
  data,
  error: null as Any,
  count: null,
  status: 200,
  statusText: 'OK',
});

export const okList = <T>(data: T[]): PostgrestResponse<T> => ({
  data,
  error: null as Any,
  count: data.length,
  status: 200,
  statusText: 'OK',
});

export const errSingle = (message = 'PostgREST error'): PostgrestSingleResponse<never> => ({
  data: null as never,
  error: { message, details: '', hint: '', code: 'XX000', name: 'PostgrestError' } as Any,
  count: null,
  status: 400,
  statusText: 'Bad Request',
});

export const errList = (message = 'PostgREST error'): PostgrestResponse<never> => ({
  data: null as any,
  error: { message, details: '', hint: '', code: 'XX000', name: 'PostgrestError' } as Any,
  count: null,
  status: 400,
  statusText: 'Bad Request',
});

export function makeMockSupabase() {
  // leaf mocks (return Promises of PostgREST responses)
  const single = jest.fn(() => Promise.resolve(okSingle(null as any)));
  const then   = jest.fn(() => Promise.resolve(okList([] as any[])));
  const insert = jest.fn(() => Promise.resolve(okSingle(null as any)));
  const update = jest.fn(() => Promise.resolve(okSingle(null as any)));

  // query "builder" with chainable links
  const query = {
    select: jest.fn().mockReturnThis(),
    insert,
    update,
    eq:     jest.fn().mockReturnThis(),
    gte:    jest.fn().mockReturnThis(),
    lte:    jest.fn().mockReturnThis(),
    single,
    then,
  };

  // supabase client whose .from() returns our query
  const client = {
    from: jest.fn(() => query),
    channel: jest.fn(() => ({
      on:          jest.fn().mockReturnThis(),
      subscribe:   jest.fn().mockReturnThis(),
      unsubscribe: jest.fn().mockReturnThis(),
      send:        jest.fn(() => Promise.resolve()),
    })),
  } as unknown as SupabaseClient;

  return { client, query, single, then, insert, update };
}
