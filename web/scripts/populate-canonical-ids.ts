/**
 * Populate Canonical IDs Script
 * 
 * This script populates canonical IDs for existing representatives
 * by running the canonical ID service on existing data.
 */

import { createClient } from '@supabase/supabase-js';
import { CanonicalIdService } from '../lib/civics/canonical-id-service';
import type { EntityType, DataSource } from '../lib/civics/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

const canonicalIdService = new CanonicalIdService();

async function populateCanonicalIds() {
  try {
    console.log('🚀 Starting canonical ID population...');
    
    // Get all representatives that don't have canonical IDs yet
    const { data: representatives, error } = await supabase
      .from('civics_representatives')
      .select('id, name, external_id, source, office, level, jurisdiction')
      .not('external_id', 'is', null)
      .limit(50); // Start with a small batch for testing

    if (error) {
      throw new Error(`Failed to fetch representatives: ${error.message}`);
    }

    if (!representatives || representatives.length === 0) {
      console.log('ℹ️ No representatives found to process');
      return;
    }

    console.log(`📊 Processing ${representatives.length} representatives...`);

    let processed = 0;
    let errors = 0;

    for (const rep of representatives) {
      try {
        console.log(`\n🔍 Processing: ${rep.name} (${rep.source})`);
        
        // Create source data for the canonical ID service
        const sourceData = [{
          source: rep.source as DataSource,
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            jurisdiction: rep.jurisdiction
          },
          sourceId: rep.external_id
        }];

        // Resolve entity and create canonical ID
        const result = await canonicalIdService.resolveEntity(
          'representative' as EntityType,
          sourceData
        );

        console.log(`✅ Created canonical ID: ${result.canonicalId}`);
        console.log(`   Sources: ${result.crosswalkEntries.length}`);
        
        processed++;

      } catch (error) {
        console.error(`❌ Error processing ${rep.name}:`, error);
        errors++;
      }
    }

    console.log(`\n🎉 Canonical ID population completed!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Success rate: ${((processed / representatives.length) * 100).toFixed(1)}%`);

    // Verify the results
    await verifyCanonicalIds();

  } catch (error) {
    console.error('❌ Canonical ID population failed:', error);
    process.exit(1);
  }
}

async function verifyCanonicalIds() {
  try {
    console.log('\n🔍 Verifying canonical ID population...');
    
    // Check how many canonical IDs were created
    const { data: crosswalkEntries, error } = await supabase
      .from('id_crosswalk')
      .select('canonical_id, source, entity_type')
      .eq('entity_type', 'representative');

    if (error) {
      console.error('❌ Failed to verify canonical IDs:', error);
      return;
    }

    if (!crosswalkEntries || crosswalkEntries.length === 0) {
      console.log('⚠️ No canonical IDs found in crosswalk table');
      return;
    }

    // Group by canonical ID to see cross-references
    const canonicalIdGroups = crosswalkEntries.reduce((acc, entry) => {
      if (!acc[entry.canonical_id]) {
        acc[entry.canonical_id] = [];
      }
      acc[entry.canonical_id].push(entry.source);
      return acc;
    }, {} as Record<string, string[]>);

    const uniqueCanonicalIds = Object.keys(canonicalIdGroups).length;
    const totalEntries = crosswalkEntries.length;
    const crossReferenced = Object.values(canonicalIdGroups).filter(sources => sources.length > 1).length;

    console.log(`✅ Canonical ID verification results:`);
    console.log(`   Unique canonical IDs: ${uniqueCanonicalIds}`);
    console.log(`   Total crosswalk entries: ${totalEntries}`);
    console.log(`   Cross-referenced entities: ${crossReferenced}`);
    console.log(`   Average sources per canonical ID: ${(totalEntries / uniqueCanonicalIds).toFixed(1)}`);

    // Show some examples
    console.log('\n📋 Sample canonical IDs:');
    Object.entries(canonicalIdGroups).slice(0, 3).forEach(([canonicalId, sources]) => {
      console.log(`   ${canonicalId}: ${sources.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting canonical ID population script...');
    
    await populateCanonicalIds();
    
    console.log('🎉 Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();

