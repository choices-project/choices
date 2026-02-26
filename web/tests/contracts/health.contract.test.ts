/**
 * Health API Contract Tests
 *
 * Verifies critical health endpoint behavior for basic and extended checks.
 *
 * @jest-environment node
 */

import { createNextRequest } from '@/tests/contracts/helpers/request';

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  default: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

describe('Health API contract', () => {
  const loadRoute = () => {
    let routeModule: { GET: (req: Request) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/health/route');
    });
    return routeModule;
  };

  it('returns 200 with status ok for basic health check', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/health'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String),
        environment: expect.any(String),
        version: expect.any(String),
      })
    );
  });

  it('returns 200 for type=basic explicitly', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/health?type=basic'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('ok');
  });

  it('returns validation error for invalid type parameter', async () => {
    const { GET } = loadRoute();
    const response = await GET(createNextRequest('http://localhost/api/health?type=invalid'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid type parameter');
  });
});

describe('Health API /api/health/ingest contract', () => {
  const loadIngestRoute = () => {
    let routeModule: { GET: (req: Request) => Promise<Response> };
    jest.isolateModules(() => {
      routeModule = require('@/app/api/health/ingest/route');
    });
    return routeModule;
  };

  it('returns 200 or 503 with valid structure', async () => {
    const { GET } = loadIngestRoute();
    const response = await GET(createNextRequest('http://localhost/api/health/ingest'));
    const body = await response.json();

    expect([200, 503]).toContain(response.status);
    if (body.success) {
      expect(body.data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
      });
    } else {
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    }
  });
});
