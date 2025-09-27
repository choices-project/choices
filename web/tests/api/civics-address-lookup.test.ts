/**
 * Test Civics Address Lookup API
 * Verifies that the address lookup endpoint works correctly
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/civics/address-lookup/route';

describe('Civics Address Lookup API', () => {
  test('should handle address lookup request', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/civics/address-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '123 Main St, Springfield, IL 62704'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return either success or configuration error
    expect([200, 503]).toContain(response.status);
    
    if (response.status === 200) {
      expect(data).toHaveProperty('ok', true);
      expect(data).toHaveProperty('jurisdiction');
    } else if (response.status === 503) {
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('not configured');
    }
  });

  test('should handle missing address', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/civics/address-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'address required');
  });

  test('should handle invalid address format', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/civics/address-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: 123 // Invalid type
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'address required');
  });
});
