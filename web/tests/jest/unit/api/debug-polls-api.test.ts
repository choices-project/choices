/**
 * Debug Polls API Test
 * 
 * This test helps debug why the polls API is returning 500 errors.
 */

import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/polls/route';

describe('Debug Polls API', () => {
  it('should debug the polls API error', async () => {
    console.log('Environment variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('SUPABASE_SECRET_KEY:', process.env.SUPABASE_SECRET_KEY);
    
    const request = new NextRequest('http://localhost:3000/api/polls');
    
    try {
      const response = await GET(request);
      const responseData = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);
      
      // For now, just log the response to debug
      expect(response.status).toBeDefined();
    } catch (error) {
      console.log('Error caught:', error);
      throw error;
    }
  });
});
