import {
  parsePartialProfileOwnerUpdate,
  parseProfileOwnerUpdate,
  stripPrivilegedProfileFields,
} from '@/lib/auth/profile-write-schema';

describe('profile-write-schema', () => {
  it('rejects trust_tier in owner profile updates', () => {
    const result = parseProfileOwnerUpdate({
      email: 'user@example.com',
      trust_tier: 'T3',
    });
    expect(result.success).toBe(false);
  });

  it('strips trust tier fields before persist', () => {
    const stripped = stripPrivilegedProfileFields({
      email: 'user@example.com',
      bio: 'hello',
      trust_tier: 'T3',
      trust_tier_score: 99,
      trust_tier_version: 2,
    });
    expect(stripped).toEqual({
      email: 'user@example.com',
      bio: 'hello',
    });
  });

  it('rejects trust_tier in partial updates', () => {
    const result = parsePartialProfileOwnerUpdate({
      trust_tier: 'T2',
    });
    expect(result.success).toBe(false);
  });
});
