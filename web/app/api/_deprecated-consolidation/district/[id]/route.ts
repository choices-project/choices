/**
 * DEPRECATED: /api/district/[id]
 * 
 * This endpoint has been deprecated in favor of the versioned API.
 * Redirects to: /api/v1/civics/district/[id]
 * 
 * Deprecated: November 6, 2025
 * Sunset: January 6, 2026
 */

import { NextRequest } from 'next/server';
import { createDeprecatedRedirect } from '@/lib/api/redirect-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return createDeprecatedRedirect(request, {
    canonical: `/api/v1/civics/district/${params.id}`,
    context: { endpoint: 'district-by-id', category: 'civics', districtId: params.id },
  });
}

