/**
 * Polls API Tests - Mock Supabase Client
 * 
 * This test mocks the Supabase client to work in the test environment
 * while still testing the actual API endpoint logic.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/polls/route';

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
            },
            {
              id: 'poll-2',
              title: 'Test Poll 2',
              total_votes: 15,
              options: [
                { id: 'opt-3', text: 'Option A', votes: 8 },
                { id: 'opt-4', text: 'Option B', votes: 7 }
              ],
              status: 'active'
            }
          ],
          error: null,
        }),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [{ 
          id: 'poll-123', 
          title: 'New Test Poll',
          total_votes: 0,
          options: [
            { id: 'opt-new-1', text: 'New Option 1', votes: 0 },
            { id: 'opt-new-2', text: 'New Option 2', votes: 0 }
          ],
          status: 'active'
        }],
        error: null,
      }),
    })),
  })),
};

// Mock the Supabase server client
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

// Mock authentication middleware
jest.mock('@/lib/core/auth/middleware', () => ({
  getUser: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
    role: 'user'
  })),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
}));

describe('Polls API - Mock Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock to return our mock client
    const { getSupabaseServerClient } = require('@/utils/supabase/server');
    getSupabaseServerClient.mockResolvedValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/polls - List Polls', () => {
    it('should return list of polls with mock data', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      console.log('Mock response status:', response.status);
      console.log('Mock response data:', responseData);

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.polls)).toBe(true);
      expect(responseData.polls.length).toBe(2);
      expect(responseData.count).toBe(2);
      expect(responseData.message).toBe('Aggregated poll results only - no individual vote data');
    });

    it('should handle pagination with mock data', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls?limit=1');
      
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.polls)).toBe(true);
      expect(responseData.polls.length).toBeLessThanOrEqual(1);
    });

    it('should return proper response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('success');
      expect(responseData).toHaveProperty('polls');
      expect(responseData).toHaveProperty('count');
      expect(responseData).toHaveProperty('message');
      expect(typeof responseData.success).toBe('boolean');
      expect(Array.isArray(responseData.polls)).toBe(true);
      expect(typeof responseData.count).toBe('number');
      expect(typeof responseData.message).toBe('string');
    });
  });

  describe('POST /api/polls - Create Poll', () => {
    it('should create a new poll with mock authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Mock Test Poll',
          options: [
            { text: 'Mock Option 1' },
            { text: 'Mock Option 2' }
          ]
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      console.log('Mock poll creation response:', responseData);

      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('poll');
      expect(responseData.poll.title).toBe('New Test Poll');
    });

    it('should reject poll creation without authentication', async () => {
      // Mock no authentication
      const { getUser } = require('@/lib/core/auth/middleware');
      getUser.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Unauthorized Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Authentication required to create polls');
    });
  });
});
