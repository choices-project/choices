/**
 * Representatives API Endpoint
 *
 * Provides REST API access to representative data from the database
 *
 * Created: October 28, 2025
 * Updated: November 6, 2025 - Modernized
 * Status: ✅ PRODUCTION
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse } from '@/lib/api';
import { civicsIntegration } from '@/lib/services/civics-integration';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const state = searchParams.get('state');
    const party = searchParams.get('party');
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    // Build query object for civics integration
    const query: any = {
      limit,
      offset
    };
    if (state) query.state = state;
    if (party) query.party = party;
    if (level) query.level = level as 'federal' | 'state' | 'local';
    if (search) query.query = search;

  // Use civics integration for real data with committee information
  const result = await civicsIntegration.getRepresentatives(query);

  return successResponse({
    representatives: result.representatives,
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore
  });
});
