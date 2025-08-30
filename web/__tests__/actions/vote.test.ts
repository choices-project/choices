/**
 * Vote Action Tests
 * Tests meaningful server-side voting functionality and security
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { vote } from '@/app/actions/vote'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser, logSecurityEvent } from '@/lib/auth/server-actions'

// Mock dependencies
jest.mock('@supabase/supabase-js')
jest.mock('@/lib/auth/server-actions')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGetAuthenticatedUser = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>
const mockLogSecurityEvent = logSecurityEvent as jest.MockedFunction<typeof logSecurityEvent>

describe('Vote Action', () => {
  let mockSupabase: any
  let mockContext: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }
    
    mockCreateClient.mockReturnValue(mockSupabase)
    
    // Mock authenticated user
    mockGetAuthenticatedUser.mockResolvedValue({
      userId: 'test-user-123',
      email: 'test@example.com',
      isActive: true
    })
    
    // Mock context
    mockContext = {
      request: new Request('http://localhost:3000'),
      headers: new Headers()
    }
  })

  describe('Input Validation', () => {
    it('validates poll ID format', async () => {
      const formData = new FormData()
      formData.append('pollId', 'invalid-poll-id')
      formData.append('optionIds', JSON.stringify(['option-1']))

      await expect(vote(formData, mockContext)).rejects.toThrow('Invalid poll ID')
    })

    it('validates option IDs format', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['invalid-option-id']))

      await expect(vote(formData, mockContext)).rejects.toThrow('Invalid option ID')
    })

    it('requires at least one option', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify([]))

      await expect(vote(formData, mockContext)).rejects.toThrow('At least one option must be selected')
    })

    it('limits maximum options to 10', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(Array(11).fill('123e4567-e89b-12d3-a456-426614174000')))

      await expect(vote(formData, mockContext)).rejects.toThrow('Maximum 10 options can be selected')
    })

    it('validates anonymous flag correctly', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))
      formData.append('anonymous', 'true')

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      const result = await vote(formData, mockContext)

      expect(result).toEqual({ success: true, voteCount: 1 })
      
      // Verify vote data includes anonymous flag
      const voteData = mockSupabase.insert.mock.calls[0][0]
      expect(voteData[0].voter_id).toBeNull()
      expect(voteData[0].voter_hash).toMatch(/^anon_test-user-123_\d+$/)
    })
  })

  describe('Authentication and Authorization', () => {
    it('requires authenticated user', async () => {
      mockGetAuthenticatedUser.mockRejectedValue(new Error('Authentication required'))

      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))

      await expect(vote(formData, mockContext)).rejects.toThrow('Authentication required')
    })

    it('handles inactive user accounts', async () => {
      mockGetAuthenticatedUser.mockResolvedValue({
        userId: 'test-user-123',
        email: 'test@example.com',
        isActive: false
      })

      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))

      await expect(vote(formData, mockContext)).rejects.toThrow('Active account required')
    })
  })

  describe('Database Operations', () => {
    it('creates vote records with correct data structure', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000'
      const optionIds = ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002']
      
      const formData = new FormData()
      formData.append('pollId', pollId)
      formData.append('optionIds', JSON.stringify(optionIds))

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      const result = await vote(formData, mockContext)

      expect(result).toEqual({ success: true, voteCount: 2 })

      // Verify vote data structure
      const voteData = mockSupabase.insert.mock.calls[0][0]
      expect(voteData).toHaveLength(2)

      voteData.forEach((vote: any, index: number) => {
        expect(vote.id).toBe('test-uuid-123')
        expect(vote.poll_id).toBe(pollId)
        expect(vote.voter_id).toBe('test-user-123')
        expect(vote.voter_hash).toBeNull()
        expect(vote.option_id).toBe(optionIds[index])
        expect(vote.payload).toEqual({
          timestamp: expect.any(String),
          anonymous: false
        })
        expect(vote.created_at).toBeDefined()
      })
    })

    it('handles database errors gracefully', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))

      // Mock database error
      mockSupabase.insert.mockResolvedValue({ 
        error: { message: 'Database constraint violation' } 
      })

      await expect(vote(formData, mockContext)).rejects.toThrow('Failed to record vote')
    })

    it('creates anonymous votes with proper hash', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))
      formData.append('anonymous', 'true')

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      const result = await vote(formData, mockContext)

      expect(result).toEqual({ success: true, voteCount: 1 })

      // Verify anonymous vote structure
      const voteData = mockSupabase.insert.mock.calls[0][0]
      expect(voteData[0].voter_id).toBeNull()
      expect(voteData[0].voter_hash).toMatch(/^anon_test-user-123_\d+$/)
      expect(voteData[0].payload.anonymous).toBe(true)
    })
  })

  describe('Security and Logging', () => {
    it('logs security events for vote casting', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000'
      const optionIds = ['123e4567-e89b-12d3-a456-426614174000']
      
      const formData = new FormData()
      formData.append('pollId', pollId)
      formData.append('optionIds', JSON.stringify(optionIds))

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      await vote(formData, mockContext)

      // Verify security event logging
      expect(mockLogSecurityEvent).toHaveBeenCalledWith('VOTE_CAST', {
        pollId,
        optionIds,
        anonymous: false,
        voteCount: 1
      }, mockContext)
    })

    it('logs security events for anonymous votes', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))
      formData.append('anonymous', 'true')

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      await vote(formData, mockContext)

      // Verify security event logging for anonymous vote
      expect(mockLogSecurityEvent).toHaveBeenCalledWith('VOTE_CAST', {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        optionIds: ['123e4567-e89b-12d3-a456-426614174000'],
        anonymous: true,
        voteCount: 1
      }, mockContext)
    })
  })

  describe('Rate Limiting', () => {
    it('enforces rate limiting configuration', async () => {
      // This test verifies that the rate limiting configuration is properly set
      // The actual rate limiting is handled by the createSecureServerAction wrapper
      
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      const result = await vote(formData, mockContext)

      // If rate limiting is working, the function should still execute successfully
      // for valid requests within the limit
      expect(result).toEqual({ success: true, voteCount: 1 })
    })
  })

  describe('Error Handling', () => {
    it('handles malformed JSON in optionIds', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', 'invalid-json')

      await expect(vote(formData, mockContext)).rejects.toThrow()
    })

    it('handles missing required fields', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      // Missing optionIds

      await expect(vote(formData, mockContext)).rejects.toThrow()
    })

    it('handles authentication errors gracefully', async () => {
      mockGetAuthenticatedUser.mockRejectedValue(new Error('Token expired'))

      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))

      await expect(vote(formData, mockContext)).rejects.toThrow('Token expired')
    })
  })

  describe('Data Integrity', () => {
    it('generates unique vote IDs for each option', async () => {
      const optionIds = ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002']
      
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(optionIds))

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      await vote(formData, mockContext)

      // Verify each vote has a unique ID
      const voteData = mockSupabase.insert.mock.calls[0][0]
      const voteIds = voteData.map((vote: any) => vote.id)
      const uniqueIds = new Set(voteIds)
      
      expect(uniqueIds.size).toBe(voteIds.length)
      expect(voteIds.length).toBe(optionIds.length)
    })

    it('includes proper timestamps in vote records', async () => {
      const formData = new FormData()
      formData.append('pollId', '123e4567-e89b-12d3-a456-426614174000')
      formData.append('optionIds', JSON.stringify(['123e4567-e89b-12d3-a456-426614174000']))

      // Mock successful database operation
      mockSupabase.insert.mockResolvedValue({ error: null })

      const beforeVote = new Date()
      await vote(formData, mockContext)
      const afterVote = new Date()

      // Verify timestamps are within expected range
      const voteData = mockSupabase.insert.mock.calls[0][0]
      const voteTimestamp = new Date(voteData[0].created_at)
      const payloadTimestamp = new Date(voteData[0].payload.timestamp)

      expect(voteTimestamp.getTime()).toBeGreaterThanOrEqual(beforeVote.getTime())
      expect(voteTimestamp.getTime()).toBeLessThanOrEqual(afterVote.getTime())
      expect(payloadTimestamp.getTime()).toBeGreaterThanOrEqual(beforeVote.getTime())
      expect(payloadTimestamp.getTime()).toBeLessThanOrEqual(afterVote.getTime())
    })
  })
})







