/**
 * Polls CRUD API Tests
 * 
 * Tests the polls API endpoints including:
 * - GET /api/polls (list polls)
 * - POST /api/polls (create poll)
 * - GET /api/polls/[id] (get poll)
 * - PUT /api/polls/[id] (update poll)
 * - DELETE /api/polls/[id] (delete poll)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/polls/route';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            range: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 'poll-123', title: 'Test Poll' }],
        error: null,
      }),
    })),
  })),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock authentication
jest.mock('@/lib/core/auth/middleware', () => ({
  getUser: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
  })),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Polls CRUD API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/polls - List Polls', () => {
    it('should return list of polls with pagination', async () => {
      const mockPolls = [
        {
          id: 'poll-1',
          title: 'Test Poll 1',
          description: 'Description 1',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          total_votes: 10,
        },
        {
          id: 'poll-2',
          title: 'Test Poll 2',
          description: 'Description 2',
          status: 'ended',
          created_at: '2025-01-02T00:00:00Z',
          total_votes: 25,
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                range: jest.fn().mockResolvedValue({
                  data: mockPolls,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls?page=1&limit=10');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.polls).toHaveLength(2);
      expect(responseData.polls[0].title).toBe('Test Poll 1');
      expect(responseData.polls[1].title).toBe('Test Poll 2');
    });

    it('should handle empty poll list', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                range: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.polls).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                range: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls');
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to fetch polls');
    });
  });

  describe('POST /api/polls - Create Poll', () => {
    it('should create a new poll with valid data', async () => {
      const mockPoll = {
        id: 'poll-123',
        title: 'New Test Poll',
        description: 'Test description',
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' },
        ],
        voting_method: 'single',
        category: 'general',
        privacy_level: 'public',
        created_by: 'user-123',
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [mockPoll],
            error: null,
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          description: 'Test description',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
          votingMethod: 'single',
          category: 'general',
          privacyLevel: 'public',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.poll.title).toBe('New Test Poll');
      expect(responseData.poll.id).toBe('poll-123');
    });

    it('should reject poll creation without authentication', async () => {
      const { getUser } = require('@/lib/core/auth/server-actions');
      getUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
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
            { text: 'Option 2' },
          ],
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
          title: 'New Test Poll',
          options: [
            { text: 'Option 1' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Title and at least 2 options are required');
    });

    it('should reject poll creation with empty options', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Title and at least 2 options are required');
    });

    it('should handle inactive user', async () => {
      const { getUser } = require('@/lib/core/auth/server-actions');
      getUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      // Mock inactive user profile
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { is_active: false },
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Active account required to create polls');
    });

    it('should handle database errors during creation', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to create poll');
    });

    it('should sanitize poll options', async () => {
      const mockPoll = {
        id: 'poll-123',
        title: 'New Test Poll',
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' },
        ],
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [mockPoll],
            error: null,
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
            { text: '' }, // Empty option should be filtered
            { text: '   ' }, // Whitespace-only option should be filtered
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.poll.options).toHaveLength(2);
    });

    it('should handle different voting methods', async () => {
      const mockPoll = {
        id: 'poll-123',
        title: 'New Test Poll',
        voting_method: 'approval',
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [mockPoll],
            error: null,
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
          votingMethod: 'approval',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.poll.voting_method).toBe('approval');
    });

    it('should handle hashtags in poll creation', async () => {
      const mockPoll = {
        id: 'poll-123',
        title: 'New Test Poll',
        hashtags: ['politics', 'democracy'],
        primary_hashtag: 'politics',
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [mockPoll],
            error: null,
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
          hashtags: ['politics', 'democracy'],
          primaryHashtag: 'politics',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.poll.hashtags).toEqual(['politics', 'democracy']);
      expect(responseData.poll.primary_hashtag).toBe('politics');
    });
  });

  describe('Input Validation', () => {
    it('should validate poll title length', async () => {
      const longTitle = 'a'.repeat(201); // Exceeds 200 character limit

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: longTitle,
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Title too long');
    });

    it('should validate poll description length', async () => {
      const longDescription = 'a'.repeat(1001); // Exceeds 1000 character limit

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          description: longDescription,
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Description too long');
    });

    it('should validate option text length', async () => {
      const longOption = 'a'.repeat(201); // Exceeds 200 character limit

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: longOption },
            { text: 'Option 2' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Option text too long');
    });

    it('should validate maximum number of options', async () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => ({ text: `Option ${i + 1}` }));

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: manyOptions,
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Too many options');
    });
  });

  describe('Security Measures', () => {
    it('should sanitize HTML in poll title', async () => {
      const mockPoll = {
        id: 'poll-123',
        title: 'New Test Poll',
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [mockPoll],
            error: null,
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '<script>alert("xss")</script>New Test Poll',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.poll.title).toBe('New Test Poll');
    });

    it('should sanitize HTML in poll options', async () => {
      const mockPoll = {
        id: 'poll-123',
        title: 'New Test Poll',
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' },
        ],
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [mockPoll],
            error: null,
          }),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Test Poll',
          options: [
            { text: '<script>alert("xss")</script>Option 1' },
            { text: 'Option 2' },
          ],
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.poll.options[0].text).toBe('Option 1');
    });
  });
});
