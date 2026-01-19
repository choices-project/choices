/**
 * @jest-environment node
 */

import { createPostgrestBuilder } from '@/tests/contracts/helpers/postgrest';
import { createNextRequest } from '@/tests/contracts/helpers/request';
import { profileRecord } from '@/tests/fixtures/api/profile';

const mockSupabaseClient: Record<string, any> = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const expectErrorEnvelope = (body: any, options?: { code?: string }) => {
  expect(body.success).toBe(false);
  expect(body.metadata).toEqual(
    expect.objectContaining({
      timestamp: expect.any(String),
    }),
  );
  if (options?.code) {
    expect(body.code).toBe(options.code);
  }
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  logger: mockLogger,
  default: mockLogger,
}));

describe('Profile API contract', () => {
  const loadRoutes = () => {
    let routeModule: any;
    jest.isolateModules(() => {
      routeModule = require('@/app/api/profile/route');
    });
    return routeModule;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.from.mockReset();
    mockSupabaseClient.auth.getUser.mockReset();
  });

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
  };

  it('returns standardized success envelope for GET', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return createPostgrestBuilder({ data: profileRecord, error: null });
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/profile'));

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          profile: expect.objectContaining({
            email: profileRecord.email,
            display_name: profileRecord.display_name,
            trust_tier: 'T1',
          }),
          preferences: profileRecord.privacy_settings,
          interests: {
            categories: profileRecord.primary_concerns,
            keywords: profileRecord.community_focus,
            topics: expect.any(Array),
          },
          onboarding: {
            completed: true,
            data: profileRecord.demographics,
          },
        }),
        metadata: expect.objectContaining({
          timestamp: expect.any(String),
        }),
      }),
    );
  });

  it('returns standardized auth error envelope when user missing', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const { GET } = loadRoutes();
    const response = await GET(createNextRequest('http://localhost/api/profile'));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_ERROR',
      }),
    );
  });

  it('updates profile fields via POST', async () => {
    const updatedProfile = { ...profileRecord, display_name: 'Updated Name' };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    let userProfilesCall = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        userProfilesCall += 1;
        if (userProfilesCall === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: profileRecord, error: null }),
              }),
            }),
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: [updatedProfile], error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile: { email: profileRecord.email, display_name: 'Updated Name' } }),
      }),
    );

    const body = await response.json();
    if (response.status !== 200) {
      console.error('Profile POST contract body', response.status, body);
    }
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.profile.display_name).toBe('Updated Name');
  });

  it('allows preferences update via POST', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: profileRecord, error: null }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [{ ...profileRecord, privacy_settings: { allow_messages: false } }],
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ preferences: { allow_messages: false } }),
      }),
    );

    const body = await response.json();
    if (response.status !== 200) {
      console.error('Preferences POST contract body', response.status, body);
    }
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.preferences?.allow_messages).toBe(false);
  });
  it('supports full profile replacement via PUT', async () => {
    const updatedProfile = { ...profileRecord, bio: 'Full replace bio' };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: [updatedProfile], error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { PUT } = loadRoutes();
    const response = await PUT(
      createNextRequest('http://localhost/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...profileRecord, bio: 'Full replace bio' }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.profile.bio).toBe('Full replace bio');
  });

  it('handles onboarding completion via POST and writes expected fields', async () => {
    const onboardingPayload = { completed: true, step: 3 };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    let profileCallCount = 0;
    const onboardingUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ ...profileRecord, demographics: onboardingPayload }],
          error: null,
        }),
      }),
    });
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        profileCallCount += 1;
        if (profileCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: profileRecord, error: null }),
              }),
            }),
          };
        }
        return {
          update: onboardingUpdate,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ onboarding: onboardingPayload }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.onboarding.data.completed).toBe(true);
    expect(onboardingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        demographics: onboardingPayload,
        trust_tier: 'T1',
        participation_style: 'balanced',
        primary_concerns: [],
        community_focus: [],
        updated_at: expect.any(String),
      }),
    );
  });
  it('returns validation error when onboarding payload fails schema validation', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: profileRecord, error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ onboarding: { step: 42 } }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expectErrorEnvelope(body, { code: 'VALIDATION_ERROR' });
    expect(body.details.step).toContain('expected number to be <=10');
  });

  it('rejects onboarding payloads with invalid field types', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: profileRecord, error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { POST } = loadRoutes();
    const response = await POST(
      createNextRequest('http://localhost/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ onboarding: { completed: 'yes' } }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expectErrorEnvelope(body, { code: 'VALIDATION_ERROR' });
    expect(body.details.completed).toContain('expected boolean');
  });
});

