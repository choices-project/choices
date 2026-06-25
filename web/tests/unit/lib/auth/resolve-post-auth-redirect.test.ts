import {
  parsePostAuthRedirectFromSearchParams,
  resolvePostAuthRedirect,
} from '@/lib/auth/resolve-post-auth-redirect';

describe('parsePostAuthRedirectFromSearchParams', () => {
  it('returns explicitPath when redirectTo is set', () => {
    expect(
      parsePostAuthRedirectFromSearchParams(
        new URLSearchParams('redirectTo=/profile/edit'),
      ),
    ).toEqual({ explicitPath: '/profile/edit' });
  });

  it('returns null when no redirect param', () => {
    expect(parsePostAuthRedirectFromSearchParams(new URLSearchParams(''))).toEqual({
      explicitPath: null,
    });
  });
});

describe('resolvePostAuthRedirect', () => {
  const userId = 'user-1';

  it('honors explicit path without profile lookup', async () => {
    const supabase = {
      from: jest.fn(),
    } as unknown as Parameters<typeof resolvePostAuthRedirect>[0];

    await expect(
      resolvePostAuthRedirect(supabase, userId, { explicitPath: '/polls/analytics' }),
    ).resolves.toBe('/polls/analytics');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('sends users without a profile to polls in minimal core', async () => {
    const supabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    } as unknown as Parameters<typeof resolvePostAuthRedirect>[0];

    await expect(
      resolvePostAuthRedirect(supabase, userId, { explicitPath: null }),
    ).resolves.toBe('/polls');
  });

  it('sends users with a profile to polls when no explicit path', async () => {
    const supabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { user_id: userId },
              error: null,
            }),
          })),
        })),
      })),
    } as unknown as Parameters<typeof resolvePostAuthRedirect>[0];

    await expect(
      resolvePostAuthRedirect(supabase, userId, { explicitPath: null }),
    ).resolves.toBe('/polls');
  });
});
