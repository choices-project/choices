import {
  detectCorruptSupabaseAuthCookies,
  isValidBase64UrlUtf8,
} from '@/utils/supabase/sanitize-cookies';

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

describe('isValidBase64UrlUtf8', () => {
  it('accepts a payload that decodes to valid UTF-8', () => {
    const payload = toBase64Url(JSON.stringify({ access_token: 'eyJ', user: { id: '1' } }));
    expect(isValidBase64UrlUtf8(payload)).toBe(true);
  });

  it('rejects an empty payload', () => {
    expect(isValidBase64UrlUtf8('')).toBe(false);
  });

  it('rejects bytes that are not valid UTF-8', () => {
    const invalidBytes = Buffer.from([0xc3, 0x28, 0xa0, 0xa1]).toString('base64')
      .replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    expect(isValidBase64UrlUtf8(invalidBytes)).toBe(false);
  });
});

describe('detectCorruptSupabaseAuthCookies', () => {
  const PROJECT = 'sb-abcdefgh-auth-token';

  it('returns an empty set when no Supabase auth cookies are present', () => {
    const result = detectCorruptSupabaseAuthCookies([
      { name: 'session', value: 'whatever' },
      { name: 'locale', value: 'en' },
    ]);
    expect(result.size).toBe(0);
  });

  it('returns an empty set for a healthy single-cookie base64 session', () => {
    const payload = toBase64Url(
      JSON.stringify({ access_token: 'eyJhbGciOi', refresh_token: 'rt', user: { id: 'u1' } })
    );
    const result = detectCorruptSupabaseAuthCookies([
      { name: PROJECT, value: `base64-${payload}` },
    ]);
    expect(result.size).toBe(0);
  });

  it('returns an empty set for a healthy chunked base64 session', () => {
    const payload = toBase64Url(
      JSON.stringify({ access_token: 'a'.repeat(2000), user: { id: 'u1' } })
    );
    const chunk0 = `base64-${payload.slice(0, 1000)}`;
    const chunk1 = payload.slice(1000);
    const result = detectCorruptSupabaseAuthCookies([
      { name: `${PROJECT}.0`, value: chunk0 },
      { name: `${PROJECT}.1`, value: chunk1 },
    ]);
    expect(result.size).toBe(0);
  });

  it('returns an empty set for legacy cookies that lack the base64- prefix', () => {
    const result = detectCorruptSupabaseAuthCookies([
      { name: PROJECT, value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
    ]);
    expect(result.size).toBe(0);
  });

  it('flags a single-cookie base64 payload that does not decode to UTF-8', () => {
    const invalidPayload = Buffer.from([0xc3, 0x28]).toString('base64')
      .replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const result = detectCorruptSupabaseAuthCookies([
      { name: PROJECT, value: `base64-${invalidPayload}` },
    ]);
    expect(Array.from(result)).toEqual([PROJECT]);
  });

  it('flags every chunk when the combined chunked payload is corrupt', () => {
    const corrupt = Buffer.from([0xff, 0xff, 0xff, 0xff]).toString('base64')
      .replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const head = `base64-${corrupt.slice(0, 4)}`;
    const tail = corrupt.slice(4);
    const result = detectCorruptSupabaseAuthCookies([
      { name: `${PROJECT}.0`, value: head },
      { name: `${PROJECT}.1`, value: tail },
    ]);
    expect(result.has(`${PROJECT}.0`)).toBe(true);
    expect(result.has(`${PROJECT}.1`)).toBe(true);
    expect(result.size).toBe(2);
  });

  it('reassembles chunks in numeric order, not lexicographic order', () => {
    const payload = toBase64Url(JSON.stringify({ access_token: 'x'.repeat(2000), user: { id: 'u' } }));
    const chunks: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      chunks.push(payload.slice(i * 200, (i + 1) * 200));
    }
    const cookies = chunks.map((value, idx) => ({
      name: `${PROJECT}.${idx}`,
      value: idx === 0 ? `base64-${value}` : value,
    }));
    // Shuffle to make sure ordering is by index, not array position.
    cookies.reverse();
    const result = detectCorruptSupabaseAuthCookies(cookies);
    expect(result.size).toBe(0);
  });

  it('does not false-positive when the same chunked cookies appear twice (header + request.cookies)', () => {
    const payload = toBase64Url(
      JSON.stringify({ access_token: 'eyJhbGciOi', refresh_token: 'rt', user: { id: 'u1' } }),
    );
    const chunk0 = `base64-${payload.slice(0, 40)}`;
    const chunk1 = payload.slice(40);
    const pair = [
      { name: `${PROJECT}.0`, value: chunk0 },
      { name: `${PROJECT}.1`, value: chunk1 },
    ];
    const result = detectCorruptSupabaseAuthCookies([...pair, ...pair]);
    expect(result.size).toBe(0);
  });

  it('ignores unrelated cookies that happen to share a prefix', () => {
    const result = detectCorruptSupabaseAuthCookies([
      { name: 'sb-abcdefgh-auth-token-code-verifier', value: 'whatever' },
      { name: 'session', value: 'noop' },
    ]);
    expect(result.size).toBe(0);
  });
});
