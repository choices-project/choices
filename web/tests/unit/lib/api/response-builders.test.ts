import { createProfilePayload } from '@/lib/api/response-builders';

describe('createProfilePayload', () => {
  it('returns defaults when profile record is missing', () => {
    const payload = createProfilePayload(null);

    expect(payload.profile).toBeNull();
    expect(payload.preferences).toBeNull();
    expect(payload.interests.categories).toEqual([]);
    expect(payload.interests.keywords).toEqual([]);
    expect(payload.interests.topics).toEqual([]);
    expect(payload.onboarding.completed).toBe(false);
    expect(payload.onboarding.data).toEqual({});
  });

  it('derives preferences, interests, and onboarding completion from the record', () => {
    const mockProfile = {
      user_id: 'user-123',
      email: 'user@example.com',
      trust_tier: 'bronze',
      is_admin: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      display_name: 'Example User',
      privacy_settings: { show_email: true },
      primary_concerns: ['health'],
      community_focus: ['housing'],
      participation_style: 'balanced',
      demographics: { age: 34 },
    };

    const payload = createProfilePayload(mockProfile);

    expect(payload.profile?.email).toBe(mockProfile.email);
    expect(payload.preferences).toEqual({ show_email: true });
    expect(payload.profile?.trust_tier).toBe('T1');
    expect(payload.interests.categories).toEqual(['health']);
    expect(payload.interests.keywords).toEqual(['housing']);
    expect(payload.onboarding.completed).toBe(true);
    expect(payload.onboarding.data).toEqual({ age: 34 });
  });
});

