/**
 * DEPRECATED: /api/admin/stats
 * 
 * This endpoint has been deprecated in favor of the admin dashboard endpoint.
 * Redirects to: /api/admin/dashboard
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/admin/dashboard',
    context: { endpoint: 'admin-stats', category: 'admin' },
  });
}

