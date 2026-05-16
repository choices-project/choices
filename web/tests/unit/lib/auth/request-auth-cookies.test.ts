import {
  humanizeOAuthExchangeError,
  isCorruptAuthCookieError,
} from '@/lib/auth/request-auth-cookies';

describe('request-auth-cookies', () => {
  it('humanizes PKCE verifier mismatch', () => {
    expect(
      humanizeOAuthExchangeError(
        '400: code challenge does not match previously saved code verifier',
      ),
    ).toContain('try GitHub again once');
  });

  it('humanizes corrupt cookie errors', () => {
    expect(humanizeOAuthExchangeError('Invalid UTF-8 sequence')).toContain(
      'stale sign-in cookie',
    );
  });

  it('detects UTF-8 corrupt cookie throws', () => {
    expect(isCorruptAuthCookieError(new Error('Invalid UTF-8 sequence'))).toBe(
      true,
    );
  });
});
