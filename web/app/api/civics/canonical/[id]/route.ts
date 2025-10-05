/**
 * Canonical ID Resolution API
 * 
 * Resolves the canonical ID for a representative across all data sources
 * This provides the unified foreign key that maps across API ingest sources
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;
    
    if (!representativeId) {
      return NextResponse.json(
        { ok: false, error: 'Representative ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔗 Resolving canonical ID for representative: ${representativeId}`);

    // Get the representative's external_id to look up in crosswalk
    const { data: representative, error: repError } = await supabase
      .from('civics_representatives')
      .select('id, name, external_id, source')
      .eq('id', representativeId)
      .single();

    if (repError || !representative) {
      return NextResponse.json(
        { ok: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Look up canonical ID in crosswalk table
    const { data: crosswalkEntries, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .select('canonical_id, source, source_id, attrs, created_at, updated_at')
      .eq('source', representative.source)
      .eq('source_id', representative.external_id);

    if (crosswalkError) {
      console.error('Crosswalk lookup error:', crosswalkError);
      return NextResponse.json(
        { ok: false, error: 'Failed to resolve canonical ID' },
        { status: 500 }
      );
    }

    if (!crosswalkEntries || crosswalkEntries.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          representative_id: representativeId,
          representative_name: representative.name,
          canonical_id: null,
          message: 'No canonical ID found - representative may not be cross-referenced across sources',
          sources: [representative.source],
          external_id: representative.external_id
        }
      });
    }

    // Get all sources for this canonical ID
    const canonicalId = crosswalkEntries[0]?.canonical_id;
    if (!canonicalId) {
      return NextResponse.json(
        { ok: false, error: 'Canonical ID not found' },
        { status: 404 }
      );
    }
    const { data: allSources, error: sourcesError } = await supabase
      .from('id_crosswalk')
      .select('source, source_id, attrs')
      .eq('canonical_id', canonicalId);

    if (sourcesError) {
      console.error('Sources lookup error:', sourcesError);
    }

    const sources = allSources || crosswalkEntries;

    return NextResponse.json({
      ok: true,
      data: {
        representative_id: representativeId,
        representative_name: representative.name,
        canonical_id: canonicalId,
        sources: sources.map(s => ({
          source: s.source,
          source_id: s.source_id,
          quality_score: s.attrs?.quality_score || 0
        })),
        cross_referenced: sources.length > 1,
        total_sources: sources.length,
        primary_source: representative.source,
        external_id: representative.external_id
      }
    });

  } catch (error) {
    console.error('Canonical ID resolution error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error during canonical ID resolution',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

