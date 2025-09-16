/**
 * Admin Authentication Tests
 * 
 * Tests the admin authentication system to ensure:
 * 1. Only users with is_admin=true can access admin functions
 * 2. Non-admin users are properly rejected
 * 3. Unauthenticated users are rejected
 * 4. Error handling works correctly
 */

// IMPORTANT: path must match the app import exactly
jest.mock('@/utils/supabase/server');

import { getAdminUser, requireAdminUser, isAdmin, requireAdmin } from '@/lib/admin-auth';
// Import the mock's helpers from the mocked module itself
import {
  getSupabaseServerClient,
  __client,
  __resetClient,
  __setFromSingle,
  __setRpcResult,
} from '@/utils/supabase/__mocks__/server';

describe('Admin Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetClient();
    // Make the wrapper return our shared client instance
    (getSupabaseServerClient as jest.Mock).mockResolvedValue(__client);
  });

  describe('isAdmin', () => {
    it('returns true for admin user', async () => {
      // 1) user is signed in
      __client.auth.getUser.mockResolvedValue({
        data: { id: 'admin-user-id', email: 'admin@example.com' },
        error: null,
      });

      // 2) RLS function returns true for admin
      __setRpcResult('is_admin', true);

      const result = await isAdmin();
      expect(result).toBe(true);

      // Verify RLS function was called
      expect(__client.rpc).toHaveBeenCalledWith('is_admin', { user_id: 'admin-user-id' });
    });

    it('returns false when not admin', async () => {
      __client.auth.getUser.mockResolvedValue({
        data: { id: 'u2' },
        error: null,
      });
      __setRpcResult('is_admin', false);

      await expect(isAdmin()).resolves.toBe(false);
    });

    it('returns false when no user', async () => {
      __client.auth.getUser.mockResolvedValue({ data: null, error: null });
      await expect(isAdmin()).resolves.toBe(false);
    });

    it('should return false when auth error occurs', async () => {
      // Mock auth error
      __client.auth.getUser.mockResolvedValue({
        data: null,
        error: new Error('Auth error')
      })

      const result = await isAdmin()
      expect(result).toBe(false)
    })

    it('should return false when profile error occurs', async () => {
      // Mock authenticated user
      __client.auth.getUser.mockResolvedValue({
        data: { id: 'user-id' },
        error: null
      })

      // Mock profile error
      const mockSelect = __client.from('users').select()
      const mockEq = mockSelect.eq()
      mockEq.single.mockResolvedValue({
        data: null,
        error: new Error('Profile not found')
      })

      const result = await isAdmin()
      expect(result).toBe(false)
    })

    it('should return false when profile is null', async () => {
      // Mock authenticated user
      __client.auth.getUser.mockResolvedValue({
        data: { id: 'user-id' },
        error: null
      })

      // Mock null profile
      const mockSelect = __client.from('users').select()
      const mockEq = mockSelect.eq()
      mockEq.single.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await isAdmin()
      expect(result).toBe(false)
    })

    it('should handle exceptions gracefully', async () => {
      // Mock exception
      __client.auth.getUser.mockRejectedValue(new Error('Database error'))

      const result = await isAdmin()
      expect(result).toBe(false)
    })
  })

  describe('requireAdmin', () => {
    it('should not throw for admin user', async () => {
      // Mock admin user
      __client.auth.getUser.mockResolvedValue({
        data: { id: 'admin-user-id' },
        error: null
      })

      // Set RLS function to return admin
      __setRpcResult('is_admin', true)

      await expect(requireAdmin()).resolves.not.toThrow()
    })

    it('should throw for non-admin user', async () => {
      // Mock non-admin user
      __client.auth.getUser.mockResolvedValue({
        data: { id: 'regular-user-id' },
        error: null
      })

      // Set RLS function to return non-admin
      __setRpcResult('is_admin', false)

      await expect(requireAdmin()).rejects.toThrow('Admin access required')
    })

    it('should throw for unauthenticated user', async () => {
      // Mock unauthenticated user
      __client.auth.getUser.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(requireAdmin()).rejects.toThrow('Not authenticated')
    })
  })

  describe('getAdminUser', () => {
    it('should return user for admin', async () => {
      const mockUser = { id: 'admin-user-id', email: 'admin@example.com' }
      
      // Mock admin user
      __client.auth.getUser.mockResolvedValue({
        data: mockUser,
        error: null
      })

      // Set RLS function to return admin
      __setRpcResult('is_admin', true)

      const result = await getAdminUser()
      expect(result).toEqual(mockUser)
    })

    it('should return null for non-admin user', async () => {
      const mockUser = { id: 'regular-user-id', email: 'user@example.com' }
      
      // Mock non-admin user
      __client.auth.getUser.mockResolvedValue({
        data: mockUser,
        error: null
      })

      // Set RLS function to return non-admin
      __setRpcResult('is_admin', false)

      const result = await getAdminUser()
      expect(result).toBeNull()
    })

    it('should return null for unauthenticated user', async () => {
      // Mock unauthenticated user
      __client.auth.getUser.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await getAdminUser()
      expect(result).toBeNull()
    })
  })

  describe('requireAdminUser', () => {
    it('should return user for admin', async () => {
      const mockUser = { id: 'admin-user-id', email: 'admin@example.com' }
      
      // Mock admin user
      __client.auth.getUser.mockResolvedValue({
        data: mockUser,
        error: null
      })

      // Set RLS function to return admin
      __setRpcResult('is_admin', true)

      const result = await requireAdminUser()
      expect(result).toEqual(mockUser)
    })

    it('should throw for non-admin user', async () => {
      const mockUser = { id: 'regular-user-id', email: 'user@example.com' }
      
      // Mock non-admin user
      __client.auth.getUser.mockResolvedValue({
        data: mockUser,
        error: null
      })

      // Set RLS function to return non-admin
      __setRpcResult('is_admin', false)

      await expect(requireAdminUser()).rejects.toThrow('Admin access required')
    })

    it('should throw for unauthenticated user', async () => {
      // Mock unauthenticated user
      __client.auth.getUser.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(requireAdminUser()).rejects.toThrow('Not authenticated')
    })
  })
})
