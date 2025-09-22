/**
 * Admin Layout
 * 
 * Main layout for all admin pages with server-side admin authentication guard.
 */

import { getAdminUser } from '@/lib/admin-auth';
import { AdminLayout } from './layout/AdminLayout';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check - this is the authoritative gate
  const user = await getAdminUser();
  
  if (!user) {
    // For E2E tests, show access denied page instead of redirecting
    // This allows tests to see the access denied message
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md mx-auto">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">You do not have access to the admin dashboard.</p>
            <div data-testid="admin-access-denied" className="text-red-600 font-medium">
              Access Denied
            </div>
            <div className="mt-6">
              <a 
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // User is authenticated and is admin - render admin layout
  return <AdminLayout>{children}</AdminLayout>;
}
