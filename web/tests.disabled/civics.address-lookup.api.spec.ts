import { test, expect, request } from '@playwright/test';

const addr = '1600 Pennsylvania Ave NW, Washington, DC';

test.describe('civics address lookup API', () => {
  test('returns live then cache', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const url = '/api/v1/civics/address-lookup';

    // 1st call: live
    const r1 = await api.post(url, { data: { address: addr } });
    expect(r1.status(), await r1.text()).toBe(200);
    const j1 = await r1.json();
    expect(j1.source).toBe('live');
    expect(j1.data).toBeTruthy();

    // 2nd call: cache (same input → HMAC cache hit)
    const r2 = await api.post(url, { data: { address: addr } });
    expect(r2.status(), await r2.text()).toBe(200);
    const j2 = await r2.json();
    expect(j2.source).toBe('cache');
  });

  test('rate limits after threshold', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const url = '/api/v1/civics/address-lookup';
    let limited = false;

    for (let i = 0; i < 150; i++) {
      const r = await api.post(url, { data: { address: `${addr} ${i}` } });
      if (r.status() === 429) { limited = true; break; }
    }
    expect(limited).toBeTruthy();
  });

  test('returns 400 on missing address', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const r = await api.post('/api/v1/civics/address-lookup', { data: {} });
    expect(r.status()).toBe(400);
  });

  test('returns 404 when feature disabled', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const r = await api.post('/api/v1/civics/address-lookup', { data: { address: addr } });
    expect(r.status()).toBe(404);
  });

  test('validates address input', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    
    // Test empty address
    const r1 = await api.post('/api/v1/civics/address-lookup', { data: { address: '' } });
    expect(r1.status()).toBe(400);
    
    // Test too long address
    const longAddr = 'a'.repeat(501);
    const r2 = await api.post('/api/v1/civics/address-lookup', { data: { address: longAddr } });
    expect(r2.status()).toBe(400);
    
    // Test invalid characters
    const r3 = await api.post('/api/v1/civics/address-lookup', { data: { address: '123 <script>alert("xss")</script>' } });
    expect(r3.status()).toBe(400);
  });

  test('handles malformed JSON', async ({ baseURL }) => {
    const api = await request.newContext({ baseURL });
    const r = await api.post('/api/v1/civics/address-lookup', { 
      data: 'invalid json',
      headers: { 'content-type': 'application/json' }
    });
    expect(r.status()).toBe(400);
  });
});
