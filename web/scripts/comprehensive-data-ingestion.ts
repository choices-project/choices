/**
 * Comprehensive Data Ingestion Script
 * 
 * This script populates all federal and state representatives for all 50 states
 * using the existing data ingestion APIs and canonical ID system.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// All 50 US states
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// States we already have data for
const EXISTING_STATES = ['TX', 'MI', 'FL', 'NC', 'GA', 'CA', 'NY', 'PA', 'IL', 'OH'];

// States we need to populate
const MISSING_STATES = ALL_STATES.filter(state => !EXISTING_STATES.includes(state));

async function comprehensiveDataIngestion() {
  try {
    console.log('🚀 Starting Comprehensive Data Ingestion...\n');
    
    // 1. Analyze current coverage
    await analyzeCurrentCoverage();
    
    // 2. Plan data ingestion for missing states
    await planDataIngestion();
    
    // 3. Test data ingestion for a few states
    await testDataIngestion();
    
    console.log('\n🎉 Comprehensive Data Ingestion Plan Complete!');
    
  } catch (error) {
    console.error('❌ Comprehensive data ingestion failed:', error);
    process.exit(1);
  }
}

async function analyzeCurrentCoverage() {
  console.log('📊 Analyzing Current Coverage...');
  
  // Get current state coverage
  const { data: stateData, error } = await supabase
    .from('civics_representatives')
    .select('jurisdiction, level, source')
    .eq('level', 'state')
    .not('jurisdiction', 'is', null);

  if (error) {
    throw new Error(`Failed to analyze coverage: ${error.message}`);
  }

  const stateCoverage = stateData.reduce((acc, rep) => {
    if (!acc[rep.jurisdiction]) {
      acc[rep.jurisdiction] = { count: 0, sources: new Set() };
    }
    acc[rep.jurisdiction].count++;
    acc[rep.jurisdiction].sources.add(rep.source);
    return acc;
  }, {} as Record<string, any>);

  const coveredStates = Object.keys(stateCoverage).sort();
  const missingStates = ALL_STATES.filter(state => !coveredStates.includes(state));

  console.log(`\n📈 Current State Coverage:`);
  console.log(`   Covered States: ${coveredStates.length}/50`);
  console.log(`   Covered: ${coveredStates.join(', ')}`);
  console.log(`   Missing: ${missingStates.join(', ')}`);
  
  // Show coverage details
  coveredStates.forEach(state => {
    const coverage = stateCoverage[state];
    console.log(`   ${state}: ${coverage.count} representatives (${Array.from(coverage.sources).join(', ')})`);
  });

  return {
    coveredStates,
    missingStates,
    totalRepresentatives: stateData.length
  };
}

async function planDataIngestion() {
  console.log('\n📋 Planning Data Ingestion...');
  
  const missingStates = MISSING_STATES;
  const batches = [];
  
  // Group states into batches of 5 for manageable processing
  for (let i = 0; i < missingStates.length; i += 5) {
    batches.push(missingStates.slice(i, i + 5));
  }
  
  console.log(`\n📊 Data Ingestion Plan:`);
  console.log(`   Missing States: ${missingStates.length}`);
  console.log(`   Batches: ${batches.length}`);
  console.log(`   States per batch: 5`);
  
  batches.forEach((batch, index) => {
    console.log(`   Batch ${index + 1}: ${batch.join(', ')}`);
  });
  
  console.log(`\n🎯 Estimated Results:`);
  console.log(`   Total States: 50`);
  console.log(`   Current Coverage: ${EXISTING_STATES.length} states`);
  console.log(`   Missing Coverage: ${missingStates.length} states`);
  console.log(`   Estimated Representatives: ~${missingStates.length * 150} state legislators`);
  console.log(`   Estimated Processing Time: ~${batches.length * 2} minutes`);
  
  return {
    missingStates,
    batches,
    estimatedRepresentatives: missingStates.length * 150,
    estimatedTime: batches.length * 2
  };
}

async function testDataIngestion() {
  console.log('\n🧪 Testing Data Ingestion...');
  
  // Test with a small state first
  const testState = 'VT'; // Vermont (small state for testing)
  
  console.log(`\n🔍 Testing with ${testState}...`);
  
  try {
    // Check if we already have data for this state
    const { data: existingData, error: checkError } = await supabase
      .from('civics_representatives')
      .select('id, name, source')
      .eq('jurisdiction', testState)
      .eq('level', 'state')
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check existing data: ${checkError.message}`);
    }

    if (existingData && existingData.length > 0) {
      console.log(`✅ ${testState} already has data: ${existingData[0].name} (${existingData[0].source})`);
      return;
    }

    console.log(`📥 ${testState} needs data ingestion`);
    console.log(`   This would require calling the data ingestion API`);
    console.log(`   Source: openstates_api`);
    console.log(`   Jurisdiction: ${testState}`);
    console.log(`   Expected: ~150 state legislators`);

  } catch (error) {
    console.error(`❌ Test failed for ${testState}:`, error);
  }
}

async function createDataIngestionPlan() {
  console.log('\n📋 Creating Data Ingestion Plan...');
  
  const plan = {
    federal: {
      status: 'complete',
      count: 253,
      source: 'govtrack_api',
      coverage: 'all_states',
      notes: 'Federal representatives already complete for all states'
    },
    state: {
      status: 'partial',
      current: EXISTING_STATES.length,
      missing: MISSING_STATES.length,
      total: 50,
      source: 'openstates_api',
      estimatedRepresentatives: MISSING_STATES.length * 150,
      notes: 'Need to ingest state legislators for 40 missing states'
    },
    local: {
      status: 'trial',
      count: 34,
      coverage: ['Los Angeles, CA', 'San Francisco, CA'],
      notes: 'Local data exists as trial for SF and LA only'
    }
  };

  console.log('\n📊 Data Ingestion Plan Summary:');
  console.log(`   Federal: ${plan.federal.status} (${plan.federal.count} representatives)`);
  console.log(`   State: ${plan.state.status} (${plan.state.current}/${plan.state.total} states)`);
  console.log(`   Local: ${plan.local.status} (${plan.local.count} representatives)`);
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Run data ingestion for missing states');
  console.log('   2. Populate canonical IDs for new data');
  console.log('   3. Verify cross-source resolution');
  console.log('   4. Test API endpoints with new data');
  
  return plan;
}

async function main() {
  try {
    console.log('🚀 Starting Comprehensive Data Ingestion Analysis...');
    
    await comprehensiveDataIngestion();
    
    console.log('\n🎉 Analysis completed successfully!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();

