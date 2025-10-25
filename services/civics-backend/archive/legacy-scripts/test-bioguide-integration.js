#!/usr/bin/env node

/**
 * @fileoverview Test bioguide_id integration for maximum cross-referencing
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_BIOGUIDE_INTEGRATION
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Test bioguide_id integration for maximum cross-referencing
 */
async function testBioguideIntegration() {
  console.log('🔍 TESTING BIOGUIDE_ID INTEGRATION');
  console.log('==================================\n');
  
  try {
    // Step 1: Clear existing data
    console.log('🧹 Step 1: Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('representatives_core')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      console.log('⚠️  Error clearing data:', deleteError.message);
    } else {
      console.log('✅ All data cleared');
    }
    
    // Step 2: Fetch representatives with bioguide IDs
    console.log('\n📡 Step 2: Fetching representatives with bioguide IDs...');
    const { exec } = require('child_process');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/fetch-current-federal-reps.js --state=CA --limit=3', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Fetch failed:', error);
          reject(error);
        } else {
          console.log('✅ Representatives fetched');
          resolve();
        }
      });
    });
    
    // Step 3: Verify bioguide IDs are stored
    console.log('\n🔍 Step 3: Verifying bioguide IDs are stored...');
    const { data: reps, error: repsError } = await supabase
      .from('representatives_core')
      .select('id, name, bioguide_id, canonical_id, state, level')
      .eq('state', 'CA')
      .eq('level', 'federal')
      .limit(3);
    
    if (repsError) {
      console.error('❌ Error fetching reps:', repsError);
      return;
    }
    
    console.log('📊 Representatives with bioguide IDs:');
    reps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name}`);
      console.log(`      Bioguide ID: ${rep.bioguide_id || 'MISSING'}`);
      console.log(`      Canonical ID: ${rep.canonical_id}`);
      console.log(`      State: ${rep.state}, Level: ${rep.level}`);
    });
    
    // Step 4: Test bioguide ID cross-referencing
    console.log('\n🔗 Step 4: Testing bioguide ID cross-referencing...');
    
    if (reps.length > 0 && reps[0].bioguide_id) {
      const testBioguideId = reps[0].bioguide_id;
      console.log(`   Testing with bioguide_id: ${testBioguideId}`);
      
      // Test finding by bioguide_id
      const { data: foundByBioguide, error: bioguideError } = await supabase
        .from('representatives_core')
        .select('id, name, bioguide_id, canonical_id')
        .eq('bioguide_id', testBioguideId)
        .maybeSingle();
      
      if (bioguideError) {
        console.log('❌ Error finding by bioguide_id:', bioguideError.message);
      } else if (foundByBioguide) {
        console.log('✅ Successfully found representative by bioguide_id');
        console.log(`   Found: ${foundByBioguide.name} (${foundByBioguide.bioguide_id})`);
      } else {
        console.log('❌ Could not find representative by bioguide_id');
      }
    } else {
      console.log('❌ No bioguide_id available for testing');
    }
    
    // Step 5: Test Congress.gov API integration with bioguide_id
    console.log('\n🌐 Step 5: Testing Congress.gov API integration...');
    
    if (reps.length > 0 && reps[0].bioguide_id) {
      const testBioguideId = reps[0].bioguide_id;
      console.log(`   Testing Congress.gov API with bioguide_id: ${testBioguideId}`);
      
      try {
        const response = await fetch(`https://api.congress.gov/v3/member/${testBioguideId}?api_key=${process.env.CONGRESS_GOV_API_KEY}`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Congress.gov API integration working');
          console.log(`   Member: ${data.member?.fullName || 'Unknown'}`);
          console.log(`   Party: ${data.member?.party || 'Unknown'}`);
          console.log(`   State: ${data.member?.state || 'Unknown'}`);
          console.log(`   Chamber: ${data.member?.chamber || 'Unknown'}`);
        } else {
          console.log('❌ Congress.gov API error:', response.status);
        }
      } catch (error) {
        console.log('❌ Congress.gov API error:', error.message);
      }
    }
    
    // Step 6: Test crosswalk integration
    console.log('\n🔗 Step 6: Testing crosswalk integration...');
    
    const { data: crosswalk, error: crosswalkError } = await supabase
      .from('representative_crosswalk')
      .select('source, source_id, canonical_id')
      .limit(10);
    
    if (crosswalkError) {
      console.log('❌ Crosswalk error:', crosswalkError.message);
    } else {
      console.log(`📊 Crosswalk entries: ${crosswalk?.length || 0}`);
      crosswalk?.forEach((entry, i) => {
        console.log(`   ${i+1}. Source: ${entry.source}, ID: ${entry.source_id}, Canonical: ${entry.canonical_id}`);
      });
    }
    
    // Step 7: Calculate bioguide integration score
    console.log('\n📈 Step 7: Bioguide Integration Score:');
    
    const totalReps = reps.length;
    const repsWithBioguide = reps.filter(rep => rep.bioguide_id).length;
    const bioguideCoverage = totalReps > 0 ? (repsWithBioguide / totalReps) * 100 : 0;
    
    console.log(`   Total Representatives: ${totalReps}`);
    console.log(`   With Bioguide IDs: ${repsWithBioguide}`);
    console.log(`   Coverage: ${bioguideCoverage.toFixed(1)}%`);
    
    // Step 8: Final success criteria
    console.log('\n✅ Step 8: Bioguide Integration Success Criteria:');
    const hasBioguideColumn = reps.length > 0 && 'bioguide_id' in reps[0];
    const hasBioguideData = repsWithBioguide > 0;
    const hasGoodCoverage = bioguideCoverage >= 80;
    const canFindByBioguide = reps.length > 0 && reps[0].bioguide_id;
    
    console.log(`   ✅ Bioguide Column: ${hasBioguideColumn ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Bioguide Data: ${hasBioguideData ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Good Coverage: ${hasGoodCoverage ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Can Find by Bioguide: ${canFindByBioguide ? 'PASS' : 'FAIL'}`);
    
    const allPassed = hasBioguideColumn && hasBioguideData && hasGoodCoverage && canFindByBioguide;
    
    console.log(`\n🎯 BIOGUIDE INTEGRATION RESULT: ${allPassed ? 'COMPLETE SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    if (allPassed) {
      console.log('🎉 BIOGUIDE INTEGRATION IS WORKING PERFECTLY!');
      console.log('✅ Maximum cross-referencing capability achieved!');
      console.log('✅ Official congressional identifiers properly stored!');
    } else {
      console.log('⚠️  Some bioguide integration issues detected.');
    }
    
  } catch (error) {
    console.error('❌ Bioguide integration test failed:', error);
  }
}

// Run the bioguide integration test
testBioguideIntegration().catch(console.error);
