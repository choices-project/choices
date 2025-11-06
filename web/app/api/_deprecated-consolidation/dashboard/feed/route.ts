/**
 * DEPRECATED: /api/dashboard/feed
 * 
 * This endpoint has been deprecated in favor of the main feed endpoint.
 * Redirects to: /api/feed
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/feed',
    context: { endpoint: 'dashboard-feed', category: 'dashboard' },
  });
}

export async function POST(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/feed',
    method: 'POST',
    context: { endpoint: 'dashboard-feed', category: 'dashboard' },
  });
}

