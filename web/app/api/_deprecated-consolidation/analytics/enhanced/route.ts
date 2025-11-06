/**
 * DEPRECATED: /api/analytics/enhanced
 * 
 * This endpoint has been deprecated. Enhanced analytics is now the default.
 * Redirects to: /api/analytics
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/analytics',
    context: { endpoint: 'analytics-enhanced', category: 'analytics' },
  });
}

