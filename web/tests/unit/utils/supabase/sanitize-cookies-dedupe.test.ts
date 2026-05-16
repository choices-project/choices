import {
  dedupeCookiesByName,
  isValidBase64UrlUtf8,
} from '@/utils/supabase/sanitize-cookies';

describe('dedupeCookiesByName', () => {
  it('prefers a valid auth-token payload over a corrupt duplicate name', () => {
    const validPayload = 'eyJhY2Nlc3NfdG9rZW4iOiJ4In0';
    expect(isValidBase64UrlUtf8(validPayload)).toBe(true);

    const cookies = dedupeCookiesByName([
      { name: 'sb-test-auth-token', value: `base64-not-valid!!!` },
      { name: 'sb-test-auth-token', value: `base64-${validPayload}` },
    ]);

    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.value).toBe(`base64-${validPayload}`);
  });

  it('keeps the longer value for non-auth cookies', () => {
    const cookies = dedupeCookiesByName([
      { name: 'choices.locale', value: 'en' },
      { name: 'choices.locale', value: 'en-US' },
    ]);

    expect(cookies[0]?.value).toBe('en-US');
  });
});
