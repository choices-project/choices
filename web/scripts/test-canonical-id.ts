/**
 * Test Canonical ID System
 * 
 * This script tests the canonical ID system by manually creating
 * a canonical ID entry and verifying it works.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function testCanonicalIdSystem() {
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
      console.error('❌ No representative found:', repError);
      return;
    }

    console.log(`📊 Testing with representative: ${representative.name}`);
    console.log(`   ID: ${representative.id}`);
    console.log(`   External ID: ${representative.external_id}`);
    console.log(`   Source: ${representative.source}`);

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
          created_by: 'test-script'
        }
      })
      .select()
      .single();

    if (crosswalkError) {
      console.error('❌ Failed to create crosswalk entry:', crosswalkError);
      return;
    }

    console.log(`✅ Created test canonical ID: ${testCanonicalId}`);
    console.log(`   Crosswalk entry ID: ${crosswalkEntry.entity_uuid}`);

    // Test the canonical ID API
    console.log('\n🔍 Testing canonical ID API...');
    
    const response = await fetch(`http://127.0.0.1:3000/api/civics/canonical/${representative.id}`);
    const result = await response.json();
    
    if (result.ok && result.data.canonical_id) {
      console.log('✅ Canonical ID API working!');
      console.log(`   Canonical ID: ${result.data.canonical_id}`);
      console.log(`   Sources: ${result.data.sources.length}`);
      console.log(`   Cross-referenced: ${result.data.cross_referenced}`);
    } else {
      console.log('⚠️ Canonical ID API returned:', result);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('id_crosswalk')
      .delete()
      .eq('entity_uuid', crosswalkEntry.entity_uuid);

    if (deleteError) {
      console.error('⚠️ Failed to clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Canonical ID system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCanonicalIdSystem();

