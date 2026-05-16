import { sanitizeUserJourneyForPersistence } from '@/lib/feedback/sanitize-user-journey';

describe('sanitizeUserJourneyForPersistence', () => {
  it('drops aborted network errors and dedupes network requests', () => {
    const result = sanitizeUserJourneyForPersistence({
      errors: [
        { type: 'network', message: 'signal is aborted without reason' },
        { type: 'javascript', message: 'Real bug' },
      ],
      performanceMetrics: {
        networkRequests: [
          { url: '/api/v1/civics/elections', method: 'GET', status: 200, duration: 100 },
          { url: '/api/v1/civics/elections', method: 'GET', status: 200, duration: 200 },
          { url: '/api/site-messages', method: 'GET', status: 200, duration: 50 },
        ],
      },
    });

    expect(result.errors).toEqual([{ type: 'javascript', message: 'Real bug' }]);
    const requests = (result.performanceMetrics as { networkRequests: unknown[] })
      .networkRequests;
    expect(requests).toHaveLength(2);
  });
});
