/**
 * DEPRECATED: /api/trending-polls
 * 
 * This endpoint has been deprecated in favor of the unified trending endpoint.
 * Redirects to: /api/trending?type=polls
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/api/trending';
  url.searchParams.set('type', 'polls');
  
  return createDeprecatedRedirect(request, {
    canonical: url.toString(),
    context: { endpoint: 'trending-polls', category: 'trending' },
  });
}

