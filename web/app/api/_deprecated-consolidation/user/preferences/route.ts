/**
 * DEPRECATED: /api/user/preferences
 * 
 * This endpoint has been deprecated in favor of the profile-scoped path.
 * Redirects to: /api/profile/preferences
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile/preferences',
    context: { endpoint: 'user-preferences', category: 'profile' },
  });
}

export async function POST(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile/preferences',
    method: 'POST',
    context: { endpoint: 'user-preferences', category: 'profile' },
  });
}

export async function PUT(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile/preferences',
    method: 'PUT',
    context: { endpoint: 'user-preferences', category: 'profile' },
  });
}

