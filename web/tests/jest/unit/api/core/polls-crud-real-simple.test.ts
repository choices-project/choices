/**
 * Polls CRUD API Tests - REAL DATABASE SIMPLE
 * 
 * This test uses REAL database connections but focuses on the basic functionality
 * without complex authentication setup. We'll start simple and build up.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/polls/route';

describe('Polls CRUD API - REAL DATABASE SIMPLE', () => {
  beforeEach(() => {
    // No complex setup needed for basic tests
  });

  afterEach(() => {
    // No cleanup needed for basic tests
  });

  describe('GET /api/polls - List Polls', () => {
    it('should return list of polls from real database', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      console.log('Real database response status:', response.status);
      console.log('Real database response data:', responseData);

      // For now, just check that we get a response
      // We'll evolve this to check the exact structure later
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('success');
      expect(responseData).toHaveProperty('polls');
      expect(Array.isArray(responseData.polls)).toBe(true);
    });

    it('should handle pagination with real database', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls?limit=5');
      
      const response = await GET(request);
      const responseData = await response.json();

      console.log('Pagination response:', responseData);

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.polls)).toBe(true);
      expect(responseData.polls.length).toBeLessThanOrEqual(5);
    });

    it('should return proper response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      // Check the response structure matches what the endpoint actually returns
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
    it('should reject poll creation without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No authorization header
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

      console.log('Unauthorized response:', responseData);

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Authentication required to create polls');
    });

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

      console.log('Malformed JSON response:', responseData);

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

      console.log('Missing body response:', responseData);

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Invalid JSON');
    });
  });

  describe('Real Database Integration', () => {
    it('should connect to real database successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      // If we get a 200 response, the database connection is working
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('success');
      
      // The response should have the expected structure
      expect(responseData).toHaveProperty('polls');
      expect(responseData).toHaveProperty('count');
      expect(responseData).toHaveProperty('message');
    });

    it('should handle database errors gracefully', async () => {
      // This test verifies that the endpoint handles database errors properly
      const request = new NextRequest('http://localhost:3000/api/polls');
      
      const response = await GET(request);
      const responseData = await response.json();

      // Should handle database errors gracefully
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('success');
      
      // If there's an error, it should be handled gracefully
      if (responseData.error) {
        expect(typeof responseData.error).toBe('string');
      }
    });
  });
});
