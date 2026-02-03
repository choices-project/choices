/**
 * GET /api/polls/bill-context integration tests
 * Validation and success with mocks.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from '@/app/api/polls/bill-context/route';
import { createNextRequest } from '@/tests/contracts/helpers/request';

jest.mock('@/lib/services/govinfo-mcp-service', () => ({
  govInfoMCPService: {
    getPackageSummary: jest.fn(),
    getRelatedBills: jest.fn(),
  },
}));

const mockGovInfo = jest.requireMock('@/lib/services/govinfo-mcp-service') as {
  govInfoMCPService: { getPackageSummary: jest.Mock; getRelatedBills: jest.Mock };
};

function createRequest(query: Record<string, string>) {
  const params = new URLSearchParams(query).toString();
  const url = `http://localhost:3000/api/polls/bill-context${params ? `?${params}` : ''}`;
  return createNextRequest(url, { method: 'GET' });
}

describe('GET /api/polls/bill-context', () => {
  beforeEach(() => {
    mockGovInfo.govInfoMCPService.getPackageSummary.mockReset();
    mockGovInfo.govInfoMCPService.getRelatedBills.mockReset();
  });

  it('returns 400 when billId is missing', async () => {
    const req = createRequest({});
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(mockGovInfo.govInfoMCPService.getPackageSummary).not.toHaveBeenCalled();
  });

  it('returns 200 with summary and relatedBills when bill exists', async () => {
    mockGovInfo.govInfoMCPService.getPackageSummary.mockResolvedValue({
      packageId: 'BILLS-119hr1-ih',
      title: 'Test Bill',
      summary: 'A test bill summary.',
      lastModified: '2025-01-01',
    });
    mockGovInfo.govInfoMCPService.getRelatedBills.mockResolvedValue([
      { packageId: 'BILLS-119hr1-rfs', title: 'Related bill' },
    ]);
    const req = createRequest({ billId: 'BILLS-119hr1-ih' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.billId).toBe('BILLS-119hr1-ih');
    expect(data.data?.summary).toBe('A test bill summary.');
    expect(data.data?.title).toBe('Test Bill');
    expect(Array.isArray(data.data?.relatedBills)).toBe(true);
    expect(data.data?.relatedBills?.length).toBe(1);
    expect(data.data?.relatedBills?.[0]?.packageId).toBe('BILLS-119hr1-rfs');
    expect(data.data?.relatedBills?.[0]?.title).toBe('Related bill');
  });
});
