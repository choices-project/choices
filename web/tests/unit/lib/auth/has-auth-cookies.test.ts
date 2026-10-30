import { hasAuthTokenCookies } from '@/lib/auth/has-auth-cookies';

describe('hasAuthTokenCookies', () => {
  it('detects chunked Supabase auth cookies', () => {
    expect(
      hasAuthTokenCookies([
        { name: 'sb-abc123-auth-token.0' },
        { name: 'sb-abc123-auth-token.1' },
      ]),
    ).toBe(true);
  });

  it('ignores unrelated cookies', () => {
    expect(
      hasAuthTokenCookies([
        { name: 'sb-abc123-auth-token-code-verifier' },
        { name: 'theme' },
      ]),
    ).toBe(false);
  });
});
