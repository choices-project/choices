/**
 * Polls CRUD API Tests - REWRITTEN
 * 
 * Tests the polls API endpoints with proper mocking to match current implementation:
 * - GET /api/polls (list polls)
 * - POST /api/polls (create poll)
 * 
 * This test is rewritten to match the actual codebase implementation
 * and then will be evolved to challenge the code functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/polls/route';

// Mock Supabase client with proper structure
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
  auth: {
    getUser: jest.fn(),
  },
};

// Mock user profile for authentication
const mockUserProfile = {
  is_active: true
};

// Mock the Supabase server client
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
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

describe('Polls CRUD API - REWRITTEN', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/polls - List Polls', () => {
    it('should return list of polls with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls?limit=2');
      
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.polls).toHaveLength(2);
      expect(responseData.polls[0].title).toBe('Test Poll 1');
      expect(responseData.polls[1].title).toBe('Test Poll 2');
      expect(responseData.count).toBe(2);
    });

    it('should handle empty poll list', async () => {
      // Mock empty response
      mockSupabaseClient.from().select().eq().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.polls).toHaveLength(0);
      expect(responseData.count).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().limit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Database connection failed');
    });
  });

  describe('POST /api/polls - Create Poll', () => {
    beforeEach(() => {
      // Mock user profile check
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });
    });

    it('should create a new poll with valid data', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: 'New Option 1' },
            { text: 'New Option 2' }
          ]
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.poll.title).toBe('New Test Poll');
      expect(responseData.poll.id).toBe('poll-123');
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

    it('should reject poll creation with missing title', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Title and at least 2 options are required');
    });

    it('should reject poll creation with insufficient options', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Insufficient Options Poll',
          options: [
            { text: 'Only One Option' }
          ]
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Title and at least 2 options are required');
    });

    it('should handle database errors during creation', async () => {
      // Mock database error during insert
      mockSupabaseClient.from().insert().select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Database Error Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ]
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Insert failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Invalid JSON');
    });

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Request body is required');
    });
  });
});
