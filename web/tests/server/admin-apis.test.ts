/**
 * Admin API Tests
 * 
 * Tests all admin API endpoints to ensure:
 * 1. Proper authentication and authorization
 * 2. Correct data handling and responses
 * 3. Error handling for various scenarios
 * 4. Security measures are in place
 */

// Mock Supabase - will load __mocks__/server.ts automatically
jest.mock('@/utils/supabase/server');

// Mock the admin auth functions after mocking Supabase
jest.mock('@/lib/admin-auth', () => ({
  ...jest.requireActual('@/lib/admin-auth'),
  requireAdminOr401: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { requireAdminOr401 } from '@/lib/admin-auth';
import {
  getSupabaseServerClient,
  __client,
  __resetClient,
  __setFromSingle,
  __setFromLimit,
} from '@/utils/supabase/server';

describe('Admin API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetClient();
    (requireAdminOr401 as jest.Mock).mockReset();
    
    // Make the wrapper return our shared client instance
    (getSupabaseServerClient as jest.Mock).mockResolvedValue(__client);
  });

  describe('Admin System Status API', () => {
    it('should return 200 for admin', async () => {
      (requireAdminOr401 as jest.Mock).mockResolvedValue(null);
      
      // Mock database calls that the system-status route makes
      __setFromLimit('pg_stat_activity', [{ pid: 123 }]);
      __setFromLimit('migrations', [{ id: 1, created_at: '2023-01-01' }]);
      __setFromLimit('user_profiles', [{ id: 1 }]);
      __setFromLimit('votes', []);
      
      const { GET } = await import('@/app/api/admin/system-status/route');
      const res = await GET(new NextRequest('http://test.local/api/admin/system-status'));
      expect(res.status).toBe(200);
      expect(requireAdminOr401).toHaveBeenCalled();
    });

    it('should return 401 for non-admin', async () => {
      (requireAdminOr401 as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      );
      const { GET } = await import('@/app/api/admin/system-status/route');
      const res = await GET(new NextRequest('http://test.local/api/admin/system-status'));
      expect(res.status).toBe(401);
      expect(requireAdminOr401).toHaveBeenCalled();
    });
  });

})
