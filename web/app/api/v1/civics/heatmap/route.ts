/**
 * Civics Heatmap API Endpoint
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * This endpoint provides privacy-safe geographic analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { isCivicsEnabled } from '@/lib/civics/privacy-utils';
import { coverBBoxWithPrefixes } from '@/lib/civics/privacy-utils';

export async function GET(request: NextRequest) {
  // Feature flag check - return 404 if disabled
  if (!isCivicsEnabled()) {
    return NextResponse.json(
      { error: 'Feature not available' }, 
      { status: 404 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const bboxStr = searchParams.get('bbox');
    const precision = (Number(searchParams.get('precision')) as 5 | 6 | 7) || 5;
    
    // Validate bbox parameter
    const bbox = bboxStr?.split(',').map(Number);
    if (!bbox || bbox.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid bbox parameter' }, 
        { status: 400 }
      );
    }

    // Validate precision
    if (![5, 6, 7].includes(precision)) {
      return NextResponse.json(
        { error: 'Invalid precision parameter' }, 
        { status: 400 }
      );
    }

    // Generate geohash prefixes for the bounding box
    const prefixes = coverBBoxWithPrefixes(bbox as [number, number, number, number], precision);

    // TODO: Call the database RPC when feature is fully implemented
    // const { data, error } = await supabase.rpc('get_heatmap', { 
    //   prefixes, 
    //   min_count: 5 // k-anonymity: hide cells with counts < 5
    // });

    // For now, return placeholder data
    const placeholderHeatmap = prefixes.slice(0, 5).map(prefix => ({
      geohash: prefix,
      count: Math.floor(Math.random() * 20) + 5 // Random count >= 5 for k-anonymity
    }));

    return NextResponse.json({
      ok: true,
      message: 'Civics heatmap is ready for implementation',
      heatmap: placeholderHeatmap,
      precision,
      bbox: bboxStr,
      k_anonymity: 5 // Minimum count threshold
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
