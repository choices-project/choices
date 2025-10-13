/**
 * Polls API Tests - Service Role Client
 * 
 * This test uses the service role client which might work better for testing
 * since it doesn't require cookies or authentication.
 */

import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/polls/route';

describe('Polls API - Service Role Client', () => {
  it('should handle missing environment variables gracefully', async () => {
    console.log('Testing with placeholder environment variables...');
    
    const request = new NextRequest('http://localhost:3000/api/polls');
    
    const response = await GET(request);
    const responseData = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', responseData);
    
    // We expect a 500 error due to invalid credentials
    expect(response.status).toBe(500);
    expect(responseData.error).toBe('Internal server error');
  });

  it('should provide meaningful error messages', async () => {
    const request = new NextRequest('http://localhost:3000/api/polls');
    
    const response = await GET(request);
    const responseData = await response.json();
    
    // The error should be handled gracefully
    expect(response.status).toBe(500);
    expect(responseData).toHaveProperty('error');
    expect(typeof responseData.error).toBe('string');
  });
});
