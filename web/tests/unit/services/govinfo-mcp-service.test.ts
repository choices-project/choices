/**
 * GovInfo MCP Service unit tests
 *
 * Verifies POST /search (Lucene-style query) and GET /related/{accessId} usage.
 *
 * GOVINFO_API_KEY must be set before this module loads (see tests/setup-govinfo-env.js).
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { govInfoMCPService } from '@/lib/services/govinfo-mcp-service';

let fetchMock: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  fetchMock = jest.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const path = url.split('?')[0];
    const method = init?.method ?? 'GET';

    if (path.includes('/search') && method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          packages: [{ packageId: 'BILLS-119hr1-ih', title: 'Test Bill', packageLink: '', lastModified: '', packageType: 'BILLS' }],
          nextPage: undefined,
          count: 1,
        }),
        text: async () => '',
        headers: new Headers(),
      } as Response);
    }

    if (path.match(/\/related\/[^/]+\/BILLS$/)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          relatedId: 'BILLS-119hr1-ih',
          results: [
            { packageId: 'BILLS-119hr1-is', title: 'Test Bill Senate', lastModified: '' },
          ],
        }),
        text: async () => '',
        headers: new Headers(),
      } as Response);
    }

    if (path.includes('/related/')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          relatedId: 'BILLS-119hr1-ih',
          relationships: [
            { relationship: 'Bill versions', collection: 'BILLS', relationshipLink: 'https://api.govinfo.gov/related/BILLS-119hr1-ih/BILLS' },
          ],
        }),
        text: async () => '',
        headers: new Headers(),
      } as Response);
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      headers: new Headers(),
    } as Response);
  });
});

describe('GovInfo MCP Service', () => {
  describe('searchBills (POST /search)', () => {
    it('uses POST /search with Lucene-style query and X-Api-Key', async () => {
      const result = await govInfoMCPService.searchBills('climate', {
        collection: 'BILLS',
        congress: 119,
        page_size: 10,
      });

      expect(fetchMock).toHaveBeenCalled();
      const postCalls = (fetchMock.mock.calls as any[]).filter((c) => c[1]?.method === 'POST');
      expect(postCalls.length).toBeGreaterThanOrEqual(1);
      const [url, init] = postCalls[0];
      expect(String(url)).toContain('/search');
      expect(init?.headers && (init.headers as Record<string, string>)['X-Api-Key']).toBe('test-key');
      const body = JSON.parse((init?.body as string) || '{}');
      expect(body.query).toContain('collection:BILLS');
      expect(body.query).toContain('congress:119');
      expect(body.query).toContain('climate');
      expect(body.sorts).toEqual([{ field: 'score', sortOrder: 'DESC' }]);

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0].packageId).toBe('BILLS-119hr1-ih');
    });
  });

  describe('getRelatedBills (GET /related/{accessId})', () => {
    it('uses GET /related/{packageId} and fetches BILLS when available', async () => {
      const result = await govInfoMCPService.getRelatedBills('BILLS-119hr1-ih');

      const getCalls = (fetchMock.mock.calls as any[]).filter((c) => c[1]?.method !== 'POST');
      const relatedCalls = getCalls.filter((c) => String(c[0]).includes('/related/'));
      expect(relatedCalls.length).toBeGreaterThanOrEqual(1);
      expect(String(relatedCalls[0][0])).toContain('/related/BILLS-119hr1-ih');
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((r) => r.packageId === 'BILLS-119hr1-is')).toBe(true);
    });
  });
});
