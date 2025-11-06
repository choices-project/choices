/**
 * DEPRECATED: /api/civics/by-state
 * 
 * This endpoint has been deprecated in favor of the versioned API.
 * Redirects to: /api/v1/civics/by-state
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/v1/civics/by-state',
    context: { endpoint: 'civics-by-state', category: 'civics' },
  });
}

export async function POST(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/v1/civics/by-state',
    method: 'POST',
    context: { endpoint: 'civics-by-state', category: 'civics' },
  });
}

