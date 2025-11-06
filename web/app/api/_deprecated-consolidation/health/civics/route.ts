/**
 * DEPRECATED: /api/health/civics
 * 
 * This endpoint has been deprecated. Civics health is now part of main health check.
 * Redirects to: /api/health
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  // Redirect to main health endpoint with service parameter
  const url = new URL(request.url);
  url.pathname = '/api/health';
  url.searchParams.set('service', 'civics');
  
  return createDeprecatedRedirect(request, {
    canonical: url.toString(),
    context: { endpoint: 'health-civics', category: 'health' },
  });
}

