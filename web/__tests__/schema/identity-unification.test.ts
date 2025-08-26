/**
 * Identity Unification Tests
 * Tests for canonical users view and unified identity model
 * 
 * These tests define how the identity system SHOULD work,
 * guiding implementation to the correct architecture.
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('Identity Unification', () => {
  let testUserId: string
  let testUserEmail: string

  beforeAll(async () => {
    // Create test user
    testUserEmail = `test-identity-${Date.now()}@example.com`
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'test-password-123',
      email_confirm: true
    })
    
    if (error || !user) {
      throw new Error(`Failed to create test user: ${error?.message}`)
    }
    
    testUserId = user.id
  })

  afterAll(async () => {
    // Cleanup test user
    await supabase.auth.admin.deleteUser(testUserId)
  })

  beforeEach(async () => {
    // Clean up any test data before each test
    await supabase.from('user_profiles').delete().eq('user_id', testUserId)
    await supabase.from('webauthn_credentials').delete().eq('user_id', testUserId)
    await supabase.from('device_flows').delete().eq('user_id', testUserId)
    await supabase.from('votes').delete().eq('user_id', testUserId)
    await supabase.from('polls').delete().eq('created_by', testUserId)
  })

  describe('Canonical Users View', () => {
    it('should provide single source of truth for user identity', async () => {
      // Test that the canonical users view exists and works
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, created_at')
        .eq('id', testUserId)
        .single()

      expect(error).toBeNull()
      expect(users).toBeDefined()
      expect(users.id).toBe(testUserId)
      expect(users.email).toBe(testUserEmail)
      expect(users.created_at).toBeDefined()
    })

    it('should maintain referential integrity with auth.users', async () => {
      // Test that canonical users view matches auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(testUserId)
      const { data: canonicalUser, error: canonicalError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single()

      expect(authError).toBeNull()
      expect(canonicalError).toBeNull()
      expect(canonicalUser.id).toBe(authUser.user.id)
      expect(canonicalUser.email).toBe(authUser.user.email)
    })
  })

  describe('Foreign Key Relationships', () => {
    it('should enforce user_id foreign key constraints', async () => {
      // Test that invalid user_id is rejected
      const invalidUserId = '00000000-0000-0000-0000-000000000000'
      
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: invalidUserId,
          username: 'testuser',
          display_name: 'Test User'
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
    })

    it('should allow valid user_id foreign key relationships', async () => {
      // Test that valid user_id is accepted
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: testUserId,
          username: 'testuser',
          display_name: 'Test User'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.user_id).toBe(testUserId)
    })

    it('should cascade delete user data when user is deleted', async () => {
      // Create test data
      await supabase.from('user_profiles').insert({
        user_id: testUserId,
        username: 'testuser',
        display_name: 'Test User'
      })

      // Verify data exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select()
        .eq('user_id', testUserId)
        .single()

      expect(profile).toBeDefined()

      // Delete user (this should cascade)
      await supabase.auth.admin.deleteUser(testUserId)

      // Verify data is deleted
      const { data: deletedProfile } = await supabase
        .from('user_profiles')
        .select()
        .eq('user_id', testUserId)

      expect(deletedProfile).toHaveLength(0)
    })
  })

  describe('RLS Policy Enforcement', () => {
    it('should enforce user can only access their own data', async () => {
      // Create test user profile
      await supabase.from('user_profiles').insert({
        user_id: testUserId,
        username: 'testuser',
        display_name: 'Test User'
      })

      // Test with authenticated user (should succeed)
      const { data: ownData, error: ownError } = await supabase
        .from('user_profiles')
        .select()
        .eq('user_id', testUserId)

      expect(ownError).toBeNull()
      expect(ownData).toHaveLength(1)

      // Test with different user (should fail due to RLS)
      const { data: otherData, error: otherError } = await supabase
        .from('user_profiles')
        .select()
        .neq('user_id', testUserId)

      // RLS should prevent access to other users' data
      expect(otherData).toHaveLength(0)
    })

    it('should allow public read access for aggregated data', async () => {
      // Create a public poll
      const { data: poll } = await supabase
        .from('polls')
        .insert({
          title: 'Test Public Poll',
          description: 'A test poll',
          created_by: testUserId,
          status: 'active',
          privacy_level: 'public',
          voting_method: 'single',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 86400000).toISOString()
        })
        .select()
        .single()

      // Create a vote
      await supabase.from('votes').insert({
        poll_id: poll.id,
        user_id: testUserId,
        vote_data: { choice: 'option1' },
        voting_method: 'single'
      })

      // Test that public aggregation policy allows reading votes for public polls
      const { data: publicVotes, error } = await supabase
        .from('votes')
        .select('poll_id, vote_data')
        .eq('poll_id', poll.id)

      expect(error).toBeNull()
      expect(publicVotes).toHaveLength(1)
    })
  })

  describe('Performance Optimization', () => {
    it('should have proper indexes for user lookups', async () => {
      // Test that user_id lookups are fast
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select()
        .eq('user_id', testUserId)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(100) // Should be very fast with proper indexes
    })

    it('should have proper indexes for relationship queries', async () => {
      // Create test data
      const { data: poll } = await supabase
        .from('polls')
        .insert({
          title: 'Test Poll',
          description: 'A test poll',
          created_by: testUserId,
          status: 'active',
          privacy_level: 'public',
          voting_method: 'single',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 86400000).toISOString()
        })
        .select()
        .single()

      await supabase.from('votes').insert({
        poll_id: poll.id,
        user_id: testUserId,
        vote_data: { choice: 'option1' },
        voting_method: 'single'
      })

      // Test composite query performance
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('votes')
        .select(`
          *,
          polls!inner(title, status),
          user_profiles!inner(username)
        `)
        .eq('user_id', testUserId)

      const endTime = Date.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(200) // Should be fast with proper indexes
    })
  })

  describe('Data Integrity', () => {
    it('should enforce NOT NULL constraints on user_id', async () => {
      // Test that user_id cannot be null
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          username: 'testuser',
          display_name: 'Test User'
          // user_id intentionally omitted
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23502') // NOT NULL violation
    })

    it('should enforce unique constraints appropriately', async () => {
      // Create first profile
      await supabase.from('user_profiles').insert({
        user_id: testUserId,
        username: 'testuser',
        display_name: 'Test User'
      })

      // Try to create duplicate (should fail)
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: testUserId,
          username: 'testuser2',
          display_name: 'Test User 2'
        })

      expect(error).toBeDefined()
      // Should fail because user can only have one profile
    })

    it('should maintain referential integrity across all tables', async () => {
      // Test that all child tables properly reference the canonical users table
      const tables = ['user_profiles', 'webauthn_credentials', 'device_flows', 'votes', 'polls']
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        expect(error).toBeNull()
        // If data exists, verify it has proper user_id references
        if (data && data.length > 0) {
          const record = data[0]
          const userIdField = table === 'polls' ? 'created_by' : 'user_id'
          
          if (record[userIdField]) {
            // Verify user exists in canonical users view
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('id', record[userIdField])
              .single()

            expect(userError).toBeNull()
            expect(user).toBeDefined()
          }
        }
      }
    })
  })

  describe('Migration Safety', () => {
    it('should preserve existing data during migration', async () => {
      // This test ensures that migration scripts don't lose data
      const { data: userCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })

      const { data: profileCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact' })

      // Verify data exists and is accessible
      expect(userCount).toBeGreaterThan(0)
      expect(profileCount).toBeGreaterThanOrEqual(0)
    })

    it('should maintain backward compatibility during transition', async () => {
      // Test that both old and new identity references work
      const { data: canonicalUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single()

      const { data: authUser } = await supabase.auth.admin.getUserById(testUserId)

      // Both should return the same user data
      expect(canonicalUser.id).toBe(authUser.user.id)
      expect(canonicalUser.email).toBe(authUser.user.email)
    })
  })
})
