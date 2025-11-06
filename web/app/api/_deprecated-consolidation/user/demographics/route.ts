/**
 * DEPRECATED: /api/user/demographics
 * 
 * This endpoint has been deprecated in favor of the analytics demographics endpoint.
 * Redirects to: /api/analytics/demographics
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/analytics/demographics',
    context: { endpoint: 'user-demographics', category: 'demographics' },
  });
}

