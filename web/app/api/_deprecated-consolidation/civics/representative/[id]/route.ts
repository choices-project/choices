/**
 * DEPRECATED: /api/civics/representative/[id]
 * 
 * This endpoint has been deprecated in favor of the versioned API.
 * Redirects to: /api/v1/civics/representative/[id]
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
    canonical: `/api/v1/civics/representative/${params.id}`,
    context: { endpoint: 'civics-representative-by-id', category: 'civics', repId: params.id },
  });
}

