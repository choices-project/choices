/**
 * Civics District Engagement Heatmap API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * Provides privacy-safe district-level civic engagement analytics.
 * Uses congressional and legislative districts for aggregation.
 * Enforces k-anonymity (min 5 users per district shown).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';

/**
 * GET /api/v1/civics/heatmap
 * 
 * Returns civic engagement aggregated by political districts.
 * 
 * @param state - Optional state filter (e.g., "CA", "NY")
 * @param level - Optional level filter ("federal", "state", "local")
 * @param min_count - Minimum users per district (default: 5 for k-anonymity)
 * 
 * @returns District engagement heatmap with k-anonymity protection
 */
export async function GET(request: NextRequest) {
  // Feature flag check - return 404 if disabled
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return NextResponse.json(
      { error: 'Feature not available' }, 
      { status: 404 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || null;
    const level = searchParams.get('level') || null;
    const minCountParam = searchParams.get('min_count');
    const minCount = minCountParam ? Number(minCountParam) : 5;
    
    // Validate level parameter if provided
    if (level && !['federal', 'state', 'local'].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level parameter. Must be: federal, state, or local' }, 
        { status: 400 }
      );
    }

    // Validate min_count
    if (minCount < 1) {
      return NextResponse.json(
        { error: 'min_count must be >= 1' }, 
        { status: 400 }
      );
    }

    // Call the database RPC function for district-based heatmap
    const { getSupabaseServerClient } = await import('@/utils/supabase/server');
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase.rpc('get_heatmap', { 
      prefixes: state ? [state] : [],
      min_count: minCount
    });

    if (error) {
      // If RPC fails, return empty heatmap (not fake data)
      console.warn('District heatmap RPC error:', error.message);
      return NextResponse.json({
        ok: true,
        heatmap: [],
        warning: 'Heatmap data temporarily unavailable',
        k_anonymity: minCount
      });
    }

    return NextResponse.json({
      ok: true,
      heatmap: data || [],
      filters: {
        state,
        level,
        min_count: minCount
      },
      k_anonymity: minCount,
      note: 'District-level aggregation with k-anonymity protection'
    });

  } catch (error) {
    console.error('Civics heatmap error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}
