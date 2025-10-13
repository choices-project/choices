/**
 * Polls API GET Test - Focus on GET endpoint only
 * 
 * This test focuses specifically on the GET endpoint to debug the mocking issue.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/polls/route';

// Mock the Supabase server client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'poll-1',
              title: 'Test Poll 1',
              total_votes: 10,
              options: [
                { id: 'opt-1', text: 'Option 1', votes: 6 },
                { id: 'opt-2', text: 'Option 2', votes: 4 }
              ],
              status: 'active'
            }
          ],
          error: null,
        }),
      })),
    })),
  })),
};

// Mock the Supabase server client
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
}));

describe('Polls API GET - Mock Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock to return our mock client
    const { getSupabaseServerClient } = require('@/utils/supabase/server');
    getSupabaseServerClient.mockImplementation(() => Promise.resolve(mockSupabaseClient));
  });

  it('should return list of polls with mock data', async () => {
    const request = new NextRequest('http://localhost:3000/api/polls');
    
    // Check if the mock is set up correctly
    const { getSupabaseServerClient } = require('@/utils/supabase/server');
    console.log('Mock function:', getSupabaseServerClient);
    console.log('Mock calls:', getSupabaseServerClient.mock.calls);
    
    const response = await GET(request);
    const responseData = await response.json();

    console.log('GET response status:', response.status);
    console.log('GET response data:', responseData);
    console.log('Mock was called:', getSupabaseServerClient.mock.calls.length > 0);
    console.log('Mock calls:', getSupabaseServerClient.mock.calls);
    
    // Check what the mock is actually returning
    const mockResult = await getSupabaseServerClient();
    console.log('Mock result:', mockResult);
    console.log('Mock result type:', typeof mockResult);
    console.log('Mock result from method:', mockResult?.from);

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.polls)).toBe(true);
    expect(responseData.polls.length).toBe(1);
    expect(responseData.count).toBe(1);
    expect(responseData.message).toBe('Aggregated poll results only - no individual vote data');
  });
});
