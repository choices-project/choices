/**
 * Representatives API Endpoint
 * 
 * Provides REST API access to representative data from the database
 * 
 * Created: October 28, 2025
 * Status: ✅ PRODUCTION
 */

import { type NextRequest, NextResponse } from 'next/server';

import { civicsIntegration } from '@/lib/services/civics-integration';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const state = searchParams.get('state');
    const party = searchParams.get('party');
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    // Build query object for civics integration
    const query = {
      limit,
      offset,
      state: state ?? undefined,
      party: party ?? undefined,
      level: level as 'federal' | 'state' | 'local' | undefined,
      query: search ?? undefined
    };

    // Use civics integration for real data with committee information
    const result = await civicsIntegration.getRepresentatives(query);

    return NextResponse.json({
      success: true,
      data: {
        representatives: result.representatives,
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
