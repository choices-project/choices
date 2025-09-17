/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js';

// Generic helpers so mockResolvedValue/RejectedValue never infers `never`
export const resolve = <T>(v: T) =>
  jest.fn().mockResolvedValue(v) as jest.MockedFunction<() => Promise<T>>;

export const rejectErr = (e: unknown) =>
  jest.fn().mockRejectedValue(e) as jest.MockedFunction<() => Promise<never>>;

// A minimal query chain that mirrors the methods your code calls
export const makeQueryChain = () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }) as jest.MockedFunction<() => Promise<{ data: any; error: any }>>,
    then: jest.fn().mockResolvedValue({ data: [], error: null }) as jest.MockedFunction<() => Promise<{ data: any[]; error: any }>>,
  };
  return chain;
};

// Supabase realtime channel stub
export const makeRealtime = () => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockReturnThis(),
    // explicitly returns Promise<void>
    send: jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<() => Promise<void>>,
});

// A minimal Supabase client mock that returns your chain objects
export const makeSupabaseClientMock = () => {
  const table = makeQueryChain();
  const realtime = makeRealtime();

  const client = {
    from: jest.fn((_table: string) => table),
    channel: jest.fn((_name: string) => realtime),
  };

  return {
    client: client as unknown as SupabaseClient,
    table,     // expose so tests can tweak .single/.then/.insert/etc
    realtime,  // expose so tests can tweak .send/.subscribe/etc
  };
};
