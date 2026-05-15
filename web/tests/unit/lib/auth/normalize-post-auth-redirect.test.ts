import {
  normalizePostAuthRedirectPath,
  pickRedirectQueryParam,
} from '@/lib/auth/normalize-post-auth-redirect';

describe('pickRedirectQueryParam', () => {
  it('prefers redirectTo over redirect and next', () => {
    const params = new URLSearchParams(
      'redirectTo=/a&redirect=/b&next=/c',
    );
    expect(pickRedirectQueryParam(params)).toBe('/a');
  });

  it('falls back to redirect then next', () => {
    expect(pickRedirectQueryParam(new URLSearchParams('redirect=/b&next=/c'))).toBe('/b');
    expect(pickRedirectQueryParam(new URLSearchParams('next=/c'))).toBe('/c');
  });

  it('returns null when absent or blank', () => {
    expect(pickRedirectQueryParam(new URLSearchParams(''))).toBeNull();
    expect(pickRedirectQueryParam(new URLSearchParams('redirectTo=  '))).toBeNull();
  });
});

describe('normalizePostAuthRedirectPath', () => {
  it('maps /login to /feed', () => {
    expect(normalizePostAuthRedirectPath('/login')).toBe('/feed');
    expect(normalizePostAuthRedirectPath('/login?foo=1')).toBe('/feed');
  });

  it('maps /auth* to /feed', () => {
    expect(normalizePostAuthRedirectPath('/auth')).toBe('/feed');
    expect(normalizePostAuthRedirectPath('/auth/callback')).toBe('/feed');
  });

  it('rejects open redirects', () => {
    expect(normalizePostAuthRedirectPath('//evil.com')).toBe('/feed');
    expect(normalizePostAuthRedirectPath('https://evil.com')).toBe('/feed');
  });

  it('preserves safe in-app paths', () => {
    expect(normalizePostAuthRedirectPath('/feed')).toBe('/feed');
    expect(normalizePostAuthRedirectPath('/dashboard')).toBe('/dashboard');
    expect(normalizePostAuthRedirectPath('/onboarding')).toBe('/onboarding');
    expect(normalizePostAuthRedirectPath('/polls/abc')).toBe('/polls/abc');
  });
});
