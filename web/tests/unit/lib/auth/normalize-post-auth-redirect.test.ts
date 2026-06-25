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
  it('maps /login to /polls', () => {
    expect(normalizePostAuthRedirectPath('/login')).toBe('/polls');
    expect(normalizePostAuthRedirectPath('/login?foo=1')).toBe('/polls');
  });

  it('maps /auth* to /polls', () => {
    expect(normalizePostAuthRedirectPath('/auth')).toBe('/polls');
    expect(normalizePostAuthRedirectPath('/auth/callback')).toBe('/polls');
  });

  it('rejects open redirects', () => {
    expect(normalizePostAuthRedirectPath('//evil.com')).toBe('/polls');
    expect(normalizePostAuthRedirectPath('https://evil.com')).toBe('/polls');
  });

  it('preserves safe in-app paths', () => {
    expect(normalizePostAuthRedirectPath('/polls')).toBe('/polls');
    expect(normalizePostAuthRedirectPath('/profile')).toBe('/profile');
    expect(normalizePostAuthRedirectPath('/polls/abc')).toBe('/polls/abc');
  });
});
