export const profileRecord = {
  id: 'profile-123',
  user_id: 'user-123',
  email: 'user@example.com',
  username: 'example-user',
  display_name: 'Example User',
  avatar_url: 'https://cdn.example.com/avatar.png',
  bio: 'Civic technologist',
  trust_tier: 't1',
  is_admin: false,
  is_active: true,
  participation_style: 'balanced',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-15T12:00:00.000Z',
  primary_concerns: ['housing', 'education'],
  community_focus: ['healthcare'],
  demographics: { age: 34, location: 'CA' },
  privacy_settings: {
    profile_visibility: 'public',
    allow_messages: true,
  },
} satisfies Record<string, unknown>;

