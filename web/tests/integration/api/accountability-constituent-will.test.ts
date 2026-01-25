/**
 * GET /api/accountability/constituent-will integration tests
 *
 * Smoke tests: validation, auth, success with mocks.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from '@/app/api/accountability/constituent-will/route';
import { createNextRequest } from '@/tests/contracts/helpers/request';
import type { getSupabaseServerClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock('@/lib/services/promise-fulfillment-service', () => ({
  promiseFulfillmentService: {
    analyzeConstituentWill: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockSupabase = jest.requireMock('@/utils/supabase/server') as {
  getSupabaseServerClient: jest.MockedFunction<typeof getSupabaseServerClient>;
};
const mockPromiseService = jest.requireMock('@/lib/services/promise-fulfillment-service') as {
  promiseFulfillmentService: { analyzeConstituentWill: jest.Mock };
};

function createMockSupabaseClient() {
  const chain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
  };
  return chain;
}

function createRequest(query: Record<string, string>) {
  const params = new URLSearchParams(query).toString();
  const url = `http://localhost:3000/api/accountability/constituent-will${params ? `?${params}` : ''}`;
  return createNextRequest(url, { method: 'GET' });
}

describe('GET /api/accountability/constituent-will', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.getSupabaseServerClient.mockResolvedValue(createMockSupabaseClient());
  });

  it('returns 400 when representativeId is missing', async () => {
    const req = createRequest({ billId: 'BILLS-119hr1-ih' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.representativeId).toBeDefined();
  });

  it('returns 400 when billId is missing', async () => {
    const req = createRequest({ representativeId: '1' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.billId).toBeDefined();
  });

  it('returns 400 when representativeId is not a positive integer', async () => {
    const req = createRequest({ representativeId: 'x', billId: 'BILLS-119hr1-ih' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details?.representativeId).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    const client = createMockSupabaseClient();
    client.auth = { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }) };
    mockSupabase.getSupabaseServerClient.mockResolvedValue(client);

    const req = createRequest({ representativeId: '1', billId: 'BILLS-119hr1-ih' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns 200 with analysis when pollId provided and authenticated', async () => {
    const client = createMockSupabaseClient();
    (client as any).auth = { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) };
    mockSupabase.getSupabaseServerClient.mockResolvedValue(client);

    const analysis = {
      representativeId: '1',
      billId: 'BILLS-119hr1-ih',
      billTitle: 'Test',
      pollResults: { pollId: 'p1', pollTitle: 'P', totalVotes: 10, constituentPreference: 'yes' as const, percentageYes: 60, percentageNo: 30, percentageAbstain: 10 },
      actualVote: { vote: 'yes' as const, alignment: 100 },
      billContext: { summary: '', relatedBills: [] },
      accountabilityScore: 85,
      lastUpdated: new Date().toISOString(),
    };
    mockPromiseService.promiseFulfillmentService.analyzeConstituentWill.mockResolvedValue(analysis);

    const req = createRequest({ representativeId: '1', billId: 'BILLS-119hr1-ih', pollId: 'p1' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(analysis);
    expect(mockPromiseService.promiseFulfillmentService.analyzeConstituentWill).toHaveBeenCalledWith('1', 'BILLS-119hr1-ih', 'p1');
  });

  it('returns 404 when pollId omitted and no constituent-will poll found', async () => {
    const client = createMockSupabaseClient();
    (client as any).auth = { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) };
    client.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.getSupabaseServerClient.mockResolvedValue(client);

    const req = createRequest({ representativeId: '1', billId: 'BILLS-119hr1-ih' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(mockPromiseService.promiseFulfillmentService.analyzeConstituentWill).not.toHaveBeenCalled();
  });
});
