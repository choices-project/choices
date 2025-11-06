/**
 * DEPRECATED: /api/user/profile
 * 
 * This endpoint has been deprecated in favor of the shorter path.
 * Redirects to: /api/profile
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile',
    context: { endpoint: 'user-profile', category: 'profile' },
  });
}

export async function PUT(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile',
    method: 'PUT',
    context: { endpoint: 'user-profile', category: 'profile' },
  });
}

export async function PATCH(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile',
    method: 'PATCH',
    context: { endpoint: 'user-profile', category: 'profile' },
  });
}

