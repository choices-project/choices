/**
 * GET /api/bills/content integration tests
 * Validation and 404 when content not found.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from '@/app/api/bills/content/route';
import { createNextRequest } from '@/tests/contracts/helpers/request';

jest.mock('@/lib/services/govinfo-mcp-service', () => ({
  govInfoMCPService: {
    getBillContent: jest.fn(),
  },
}));

const mockGovInfo = jest.requireMock('@/lib/services/govinfo-mcp-service') as {
  govInfoMCPService: { getBillContent: jest.Mock };
};

function createRequest(query: Record<string, string>) {
  const params = new URLSearchParams(query).toString();
  const url = `http://localhost:3000/api/bills/content${params ? `?${params}` : ''}`;
  return createNextRequest(url, { method: 'GET' });
}

describe('GET /api/bills/content', () => {
  beforeEach(() => {
    mockGovInfo.govInfoMCPService.getBillContent.mockReset();
  });

  it('returns 400 when packageId is missing', async () => {
    const req = createRequest({ format: 'html' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(mockGovInfo.govInfoMCPService.getBillContent).not.toHaveBeenCalled();
  });

  it('returns 200 with content when package exists', async () => {
    mockGovInfo.govInfoMCPService.getBillContent.mockResolvedValue({
      packageId: 'BILLS-119hr1-ih',
      content: '<div>Bill text</div>',
      format: 'html',
    });
    const req = createRequest({ packageId: 'BILLS-119hr1-ih', format: 'html' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data?.content).toBe('<div>Bill text</div>');
    expect(data.data?.packageId).toBe('BILLS-119hr1-ih');
    expect(mockGovInfo.govInfoMCPService.getBillContent).toHaveBeenCalledWith('BILLS-119hr1-ih', 'html');
  });

  it('returns 404 when bill content not found', async () => {
    mockGovInfo.govInfoMCPService.getBillContent.mockResolvedValue(null);
    const req = createRequest({ packageId: 'BILLS-nonexistent', format: 'html' });
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
