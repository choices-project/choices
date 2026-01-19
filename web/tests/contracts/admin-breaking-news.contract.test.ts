/**
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

const mockSupabaseClient: Record<string, any> = {
  auth: {
    getUser: jest.fn(),
  },
};

const mockNewsService = {
  getBreakingNews: jest.fn(),
  createBreakingNews: jest.fn(),
};

const mockAuditService = {
  logAdminAction: jest.fn(),
};

jest.mock('@/features/auth/lib/admin-auth', () => ({
  requireAdminOr401: jest.fn(async () => null),
}));

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(async () => mockSupabaseClient),
}));

jest.mock('@/lib/core/services/real-time-news', () => ({
  RealTimeNewsService: jest.fn(() => mockNewsService),
}));

jest.mock('@/lib/services/audit-log-service', () => ({
  createAuditLogService: jest.fn(() => mockAuditService),
}));

const loadRoute = () => {
  let routeModule: any;
  jest.isolateModules(() => {
    routeModule = require('@/app/api/admin/breaking-news/route');
  });
  return routeModule;
};

describe('Admin breaking news contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id', email: 'admin@example.com' } },
      error: null,
    });
    mockAuditService.logAdminAction.mockResolvedValue(null);
  });

  it('creates breaking news entries and logs audit trail', async () => {
    mockNewsService.createBreakingNews.mockResolvedValue({
      id: 'story-1',
      headline: 'Breaking News',
    });

    const body = {
      headline: 'Breaking News',
      summary: 'Summary',
      sourceName: 'Choices Wire',
      category: ['civics'],
    };

    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/admin/breaking-news', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.story.id).toBe('story-1');
    expect(mockAuditService.logAdminAction).toHaveBeenCalledWith(
      'admin-id',
      'breaking_news:create',
      '/api/admin/breaking-news',
      expect.objectContaining({
        metadata: expect.objectContaining({
          headline: 'Breaking News',
          storyId: 'story-1',
        }),
      })
    );
  });

  it('returns validation error when required fields missing', async () => {
    const { POST } = loadRoute();
    const response = await POST(
      createNextRequest('http://localhost/api/admin/breaking-news', {
        method: 'POST',
        body: JSON.stringify({ headline: '', summary: '', sourceName: '' }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe('VALIDATION_ERROR');
  });
});


