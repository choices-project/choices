/**
 * DEPRECATED: /api/user/settings
 * 
 * This endpoint has been deprecated in favor of the profile-scoped path.
 * Redirects to: /api/profile/settings
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile/settings',
    context: { endpoint: 'user-settings', category: 'profile' },
  });
}

export async function POST(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile/settings',
    method: 'POST',
    context: { endpoint: 'user-settings', category: 'profile' },
  });
}

export async function PUT(request: NextRequest) {
  return createDeprecatedRedirect(request, {
    canonical: '/api/profile/settings',
    method: 'PUT',
    context: { endpoint: 'user-settings', category: 'profile' },
  });
}

