/**
 * Data Ingestion Audit Script
 * 
 * This script audits the current data ingestion system by:
 * 1. Analyzing existing data sources and quality
 * 2. Testing canonical ID population
 * 3. Verifying cross-source resolution capabilities
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function auditDataIngestion() {
  try {
    console.log('🔍 Starting Data Ingestion Audit...\n');
    
    // 1. Analyze existing data sources
    await analyzeDataSources();
    
    // 2. Test canonical ID system
    await testCanonicalIdSystem();
    
    // 3. Verify data quality
    await verifyDataQuality();
    
    // 4. Test cross-source resolution
    await testCrossSourceResolution();
    
    console.log('\n🎉 Data Ingestion Audit Complete!');
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

async function analyzeDataSources() {
  console.log('📊 Analyzing Data Sources...');
  
  const { data: sourceStats, error } = await supabase
    .from('civics_representatives')
    .select('source, level, jurisdiction')
    .not('source', 'is', null);

  if (error) {
    console.error('❌ Failed to analyze sources:', error);
    return;
  }

  // Group by source
  const sourceGroups = sourceStats.reduce((acc, rep) => {
    const key = `${rep.source}-${rep.level}`;
    if (!acc[key]) {
      acc[key] = { source: rep.source, level: rep.level, count: 0, jurisdictions: new Set() };
    }
    acc[key].count++;
    acc[key].jurisdictions.add(rep.jurisdiction);
    return acc;
  }, {} as Record<string, any>);

  console.log('\n📈 Data Source Analysis:');
  Object.values(sourceGroups).forEach((group: any) => {
    console.log(`   ${group.source} (${group.level}): ${group.count} representatives`);
    console.log(`     Jurisdictions: ${Array.from(group.jurisdictions).join(', ')}`);
  });

  const totalRepresentatives = sourceStats.length;
  console.log(`\n📊 Total Representatives: ${totalRepresentatives}`);
}

async function testCanonicalIdSystem() {
  console.log('\n🔗 Testing Canonical ID System...');
  
  // Check if crosswalk table has any entries
  const { data: crosswalkEntries, error } = await supabase
    .from('id_crosswalk')
    .select('canonical_id, source, entity_type')
    .limit(5);

  if (error) {
    console.error('❌ Failed to check crosswalk table:', error);
    return;
  }

  if (!crosswalkEntries || crosswalkEntries.length === 0) {
    console.log('⚠️ No canonical IDs found in crosswalk table');
    console.log('   This means the canonical ID system is not populated yet');
    return;
  }

  console.log(`✅ Found ${crosswalkEntries.length} canonical ID entries`);
  
  // Group by canonical ID to see cross-references
  const canonicalIdGroups = crosswalkEntries.reduce((acc, entry) => {
    if (!acc[entry.canonical_id]) {
      acc[entry.canonical_id] = [];
    }
    acc[entry.canonical_id].push(entry.source);
    return acc;
  }, {} as Record<string, string[]>);

  const uniqueCanonicalIds = Object.keys(canonicalIdGroups).length;
  const crossReferenced = Object.values(canonicalIdGroups).filter(sources => sources.length > 1).length;

  console.log(`   Unique canonical IDs: ${uniqueCanonicalIds}`);
  console.log(`   Cross-referenced entities: ${crossReferenced}`);
}

async function verifyDataQuality() {
  console.log('\n🔍 Verifying Data Quality...');
  
  // Check for representatives with missing critical fields
  const { data: incompleteData, error } = await supabase
    .from('civics_representatives')
    .select('id, name, source, external_id, office, party')
    .or('external_id.is.null,office.is.null,party.is.null')
    .limit(10);

  if (error) {
    console.error('❌ Failed to check data quality:', error);
    return;
  }

  if (incompleteData && incompleteData.length > 0) {
    console.log(`⚠️ Found ${incompleteData.length} representatives with missing data:`);
    incompleteData.forEach(rep => {
      const missing = [];
      if (!rep.external_id) missing.push('external_id');
      if (!rep.office) missing.push('office');
      if (!rep.party) missing.push('party');
      console.log(`   ${rep.name} (${rep.source}): Missing ${missing.join(', ')}`);
    });
  } else {
    console.log('✅ All representatives have complete critical data');
  }

  // Check for duplicate external IDs
  const { data: duplicates, error: dupError } = await supabase
    .from('civics_representatives')
    .select('external_id, source, count')
    .not('external_id', 'is', null)
    .group('external_id, source')
    .having('count', 'gt', 1);

  if (dupError) {
    console.error('❌ Failed to check for duplicates:', dupError);
  } else if (duplicates && duplicates.length > 0) {
    console.log(`⚠️ Found ${duplicates.length} potential duplicate external IDs`);
  } else {
    console.log('✅ No duplicate external IDs found');
  }
}

async function testCrossSourceResolution() {
  console.log('\n🔄 Testing Cross-Source Resolution...');
  
  // Look for representatives that might exist in multiple sources
  const { data: representatives, error } = await supabase
    .from('civics_representatives')
    .select('name, source, external_id, office, level')
    .not('external_id', 'is', null)
    .limit(20);

  if (error) {
    console.error('❌ Failed to test cross-source resolution:', error);
    return;
  }

  // Group by name to find potential matches
  const nameGroups = representatives.reduce((acc, rep) => {
    const normalizedName = rep.name.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (!acc[normalizedName]) {
      acc[normalizedName] = [];
    }
    acc[normalizedName].push(rep);
    return acc;
  }, {} as Record<string, any[]>);

  const potentialMatches = Object.entries(nameGroups)
    .filter(([_, reps]) => reps.length > 1)
    .slice(0, 5);

  if (potentialMatches.length > 0) {
    console.log('🔍 Found potential cross-source matches:');
    potentialMatches.forEach(([name, reps]) => {
      console.log(`   ${name}:`);
      reps.forEach(rep => {
        console.log(`     ${rep.source} (${rep.level}): ${rep.external_id}`);
      });
    });
  } else {
    console.log('ℹ️ No obvious cross-source matches found in sample');
  }
}

async function main() {
  try {
    console.log('🚀 Starting Data Ingestion Audit...');
    
    await auditDataIngestion();
    
    console.log('\n🎉 Audit completed successfully!');
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

main();

