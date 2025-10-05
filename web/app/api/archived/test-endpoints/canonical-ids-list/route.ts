/**
 * List Canonical IDs API
 * 
 * This endpoint lists all canonical IDs in the system
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Listing Canonical IDs...');
    
    // Get all canonical ID entries
    const { data: crosswalkEntries, error } = await supabase
      .from('id_crosswalk')
      .select('canonical_id, source, source_id, entity_type, attrs, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch canonical IDs: ${error.message}`);
    }

    if (!crosswalkEntries || crosswalkEntries.length === 0) {
      return NextResponse.json({
        ok: true,
        canonicalIds: [],
        count: 0,
        message: 'No canonical IDs found in the system'
      });
    }

    // Group by canonical ID
    const canonicalIdGroups = crosswalkEntries.reduce((acc, entry) => {
      if (!acc[entry.canonical_id]) {
        acc[entry.canonical_id] = {
          canonical_id: entry.canonical_id,
          entity_type: entry.entity_type,
          sources: [],
          created_at: entry.created_at
        };
      }
      acc[entry.canonical_id].sources.push({
        source: entry.source,
        source_id: entry.source_id,
        quality_score: entry.attrs?.quality_score || 0,
        created_at: entry.created_at
      });
      return acc;
    }, {} as Record<string, any>);

    const canonicalIds = Object.values(canonicalIdGroups).map((group: any) => ({
      canonical_id: group.canonical_id,
      entity_type: group.entity_type,
      source_count: group.sources.length,
      sources: group.sources,
      created_at: group.created_at,
      cross_referenced: group.sources.length > 1
    }));

    return NextResponse.json({
      ok: true,
      canonicalIds,
      count: canonicalIds.length,
      crossReferenced: canonicalIds.filter(ci => ci.cross_referenced).length,
      message: `Found ${canonicalIds.length} canonical IDs with ${canonicalIds.filter(ci => ci.cross_referenced).length} cross-referenced entities`
    });

  } catch (error) {
    console.error('❌ Failed to list canonical IDs:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to list canonical IDs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

