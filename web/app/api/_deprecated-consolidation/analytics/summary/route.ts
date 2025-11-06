/**
 * DEPRECATED: /api/analytics/summary
 * 
 * This endpoint has been deprecated in favor of the main analytics endpoint with summary filter.
 * Redirects to: /api/analytics?view=summary
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/api/analytics';
  url.searchParams.set('view', 'summary');
  
  return createDeprecatedRedirect(request, {
    canonical: url.toString(),
    context: { endpoint: 'analytics-summary', category: 'analytics' },
  });
}

