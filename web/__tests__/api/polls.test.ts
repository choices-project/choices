/**
 * Polls API Tests
 * Tests meaningful API functionality including authentication, validation, and data handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/polls/[id]/vote/route'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

// Mock dependencies
jest.mock('@supabase/supabase-js')
jest.mock('@/lib/auth')
jest.mock('@/lib/hybrid-voting-service')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

// Mock HybridVotingService
jest.mock('@/lib/hybrid-voting-service', () => ({
  HybridVotingService: jest.fn().mockImplementation(() => ({
    submitVote: jest.fn()
  }))
}))

import { HybridVotingService } from '@/lib/hybrid-voting-service'

const mockHybridVotingService = HybridVotingService as jest.MockedClass<typeof HybridVotingService>

describe('Polls API', () => {
  let mockSupabase: any
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }
    
    mockCreateClient.mockReturnValue(mockSupabase)
    
    // Mock request
    mockRequest = new NextRequest('http://localhost:3000/api/polls/test-poll/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test-token'
      },
      body: JSON.stringify({
        choice: 1,
        privacy_level: 'public'
      })
    })
  })

  describe('POST /api/polls/[id]/vote', () => {
    it('successfully processes a valid vote', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })
      
      const mockVotingService = {
        submitVote: jest.fn().mockResolvedValue({
          success: true,
          message: 'Vote submitted successfully'
        })
      }
      mockHybridVotingService.mockImplementation(() => mockVotingService as any)

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Vote submitted successfully')
      
      // Verify voting service was called with correct parameters
      expect(mockVotingService.submitVote).toHaveBeenCalledWith({
        pollId: 'test-poll-123',
        choice: 1,
        privacyLevel: 'public',
        userId: 'test-user-123'
      })
    })

    it('requires authentication', async () => {
      mockGetCurrentUser.mockReturnValue(null)

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required to vote')
    })

    it('requires active user account', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: false },
        error: null
      })

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Active account required to vote')
    })

    it('validates poll ID parameter', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)

      const response = await POST(mockRequest, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Poll ID is required')
    })

    it('validates choice parameter', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })

      // Test with invalid choice
      const invalidRequest = new NextRequest('http://localhost:3000/api/polls/test-poll/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=test-token'
        },
        body: JSON.stringify({
          choice: 0, // Invalid choice
          privacy_level: 'public'
        })
      })

      const response = await POST(invalidRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Valid choice is required')
    })

    it('handles voting service errors', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })
      
      const mockVotingService = {
        submitVote: jest.fn().mockResolvedValue({
          success: false,
          message: 'Poll not found'
        })
      }
      mockHybridVotingService.mockImplementation(() => mockVotingService as any)

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Poll not found')
    })

    it('handles general voting errors', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })
      
      const mockVotingService = {
        submitVote: jest.fn().mockResolvedValue({
          success: false,
          message: 'Database error occurred'
        })
      }
      mockHybridVotingService.mockImplementation(() => mockVotingService as any)

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error occurred')
    })

    it('handles malformed request body', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })

      // Test with malformed JSON
      const malformedRequest = new NextRequest('http://localhost:3000/api/polls/test-poll/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=test-token'
        },
        body: 'invalid json'
      })

      const response = await POST(malformedRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid request body')
    })

    it('uses default privacy level when not specified', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })
      
      const mockVotingService = {
        submitVote: jest.fn().mockResolvedValue({
          success: true,
          message: 'Vote submitted successfully'
        })
      }
      mockHybridVotingService.mockImplementation(() => mockVotingService as any)

      // Request without privacy_level
      const requestWithoutPrivacy = new NextRequest('http://localhost:3000/api/polls/test-poll/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=test-token'
        },
        body: JSON.stringify({
          choice: 1
        })
      })

      const response = await POST(requestWithoutPrivacy, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify default privacy level was used
      expect(mockVotingService.submitVote).toHaveBeenCalledWith({
        pollId: 'test-poll-123',
        choice: 1,
        privacyLevel: 'public', // Default value
        userId: 'test-user-123'
      })
    })

    it('handles database query errors', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Database error')
    })

    it('handles missing user profile', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      })

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Active account required to vote')
    })
  })

  describe('Error Handling', () => {
    it('handles unexpected errors gracefully', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockRejectedValue(new Error('Unexpected database error'))

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Internal server error')
    })

    it('handles missing Supabase client', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockCreateClient.mockReturnValue(null)

      const response = await POST(mockRequest, { params: { id: 'test-poll-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Supabase client not available')
    })
  })

  describe('Security', () => {
    it('validates user permissions', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })
      
      const mockVotingService = {
        submitVote: jest.fn().mockResolvedValue({
          success: true,
          message: 'Vote submitted successfully'
        })
      }
      mockHybridVotingService.mockImplementation(() => mockVotingService as any)

      // Verify user ID is passed to voting service
      await POST(mockRequest, { params: { id: 'test-poll-123' } })

      expect(mockVotingService.submitVote).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123'
        })
      )
    })

    it('prevents voting with invalid poll ID', async () => {
      const mockUser = {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
      
      mockGetCurrentUser.mockReturnValue(mockUser)
      mockSupabase.single.mockResolvedValue({
        data: { is_active: true },
        error: null
      })
      
      const mockVotingService = {
        submitVote: jest.fn().mockResolvedValue({
          success: false,
          message: 'Poll not found'
        })
      }
      mockHybridVotingService.mockImplementation(() => mockVotingService as any)

      const response = await POST(mockRequest, { params: { id: 'invalid-poll-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Poll not found')
    })
  })
})







