/**
 * DEPRECATED: /api/civic-actions
 * 
 * This endpoint has been deprecated in favor of the versioned API.
 * Redirects to: /api/v1/civics/actions
 * 
 * Note: This was an alternate naming convention that has been consolidated.
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/v1/civics/actions',
    context: { endpoint: 'civic-actions-alt', category: 'civics' },
  });
}

export async function POST(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/v1/civics/actions',
    method: 'POST',
    context: { endpoint: 'civic-actions-alt', category: 'civics' },
  });
}

