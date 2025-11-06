/**
 * DEPRECATED: /api/status
 * 
 * This endpoint has been deprecated in favor of the health check endpoint.
 * Redirects to: /api/health
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/health',
    context: { endpoint: 'status', category: 'health' },
  });
}

