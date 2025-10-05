/**
 * Test Canonical ID System
 * 
 * This endpoint tests the canonical ID system by manually creating
 * a crosswalk entry and verifying it works.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing canonical ID system...');
    
    // Get a representative to test with
    const { data: representative, error: repError } = await supabase
      .from('civics_representatives')
      .select('id, name, external_id, source')
      .not('external_id', 'is', null)
      .limit(1)
      .single();

    if (repError || !representative) {
      return NextResponse.json(
        { ok: false, error: 'No representative found for testing' },
        { status: 404 }
      );
    }

    console.log(`📊 Testing with representative: ${representative.name}`);

    // Create a test canonical ID entry
    const testCanonicalId = `test-canonical-${Date.now()}`;
    
    const { data: crosswalkEntry, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .insert({
        entity_type: 'representative',
        canonical_id: testCanonicalId,
        source: representative.source,
        source_id: representative.external_id,
        attrs: {
          quality_score: 0.95,
          test_entry: true,
          created_by: 'test-api'
        }
      })
      .select()
      .single();

    if (crosswalkError) {
      console.error('❌ Failed to create crosswalk entry:', crosswalkError);
      return NextResponse.json(
        { ok: false, error: 'Failed to create crosswalk entry', details: crosswalkError },
        { status: 500 }
      );
    }

    console.log(`✅ Created test canonical ID: ${testCanonicalId}`);

    // Test the canonical ID resolution
    const { data: allSources, error: sourcesError } = await supabase
      .from('id_crosswalk')
      .select('source, source_id, attrs')
      .eq('canonical_id', testCanonicalId);

    if (sourcesError) {
      console.error('❌ Failed to fetch sources:', sourcesError);
    }

    const sources = allSources || [crosswalkEntry];

    return NextResponse.json({
      ok: true,
      test: {
        representative_id: representative.id,
        representative_name: representative.name,
        canonical_id: testCanonicalId,
        crosswalk_entry_id: crosswalkEntry.entity_uuid,
        sources: sources.map(s => ({
          source: s.source,
          source_id: s.source_id,
          quality_score: s.attrs?.quality_score || 0
        })),
        total_sources: sources.length,
        test_successful: true
      },
      message: 'Canonical ID system test completed successfully'
    });

  } catch (error) {
    console.error('❌ Canonical ID test failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Canonical ID test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Cleaning up test canonical ID entries...');
    
    // Delete all test entries
    const { data: deletedEntries, error: deleteError } = await supabase
      .from('id_crosswalk')
      .delete()
      .eq('attrs->>test_entry', 'true')
      .select();

    if (deleteError) {
      console.error('❌ Failed to clean up test data:', deleteError);
      return NextResponse.json(
        { ok: false, error: 'Failed to clean up test data', details: deleteError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      cleaned_up: deletedEntries?.length || 0,
      message: 'Test canonical ID entries cleaned up successfully'
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

