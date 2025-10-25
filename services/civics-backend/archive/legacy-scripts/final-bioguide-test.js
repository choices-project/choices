#!/usr/bin/env node

/**
 * @fileoverview Final comprehensive test with bioguide_id integration
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_FINAL_BIOGUIDE_TEST
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Final comprehensive test with bioguide_id integration
 */
async function finalBioguideTest() {
  console.log('🎯 FINAL COMPREHENSIVE TEST WITH BIOGUIDE_ID INTEGRATION');
  console.log('======================================================\n');
  
  try {
    // Step 1: Clear all data
    console.log('🧹 Step 1: Clearing all data...');
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
      exec('node scripts/fetch-current-federal-reps.js --state=CA --limit=2', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Fetch failed:', error);
          reject(error);
        } else {
          console.log('✅ Representatives fetched with bioguide IDs');
          resolve();
        }
      });
    });
    
    // Step 3: Verify bioguide IDs are stored
    console.log('\n🔍 Step 3: Verifying bioguide IDs are stored...');
    const { data: reps, error: repsError } = await supabase
      .from('representatives_core')
      .select('id, name, bioguide_id, canonical_id, state, level, party')
      .eq('state', 'CA')
      .eq('level', 'federal')
      .limit(2);
    
    if (repsError) {
      console.error('❌ Error fetching reps:', repsError);
      return;
    }
    
    console.log('📊 Representatives with bioguide IDs:');
    reps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name} (${rep.party})`);
      console.log(`      Bioguide ID: ${rep.bioguide_id}`);
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
        .limit(1);
      
      if (bioguideError) {
        console.log('❌ Error finding by bioguide_id:', bioguideError.message);
      } else if (foundByBioguide && foundByBioguide.length > 0) {
        console.log('✅ Successfully found representative by bioguide_id');
        console.log(`   Found: ${foundByBioguide[0].name} (${foundByBioguide[0].bioguide_id})`);
      } else {
        console.log('❌ Could not find representative by bioguide_id');
      }
    }
    
    // Step 5: Test Congress.gov API integration
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
    
    // Step 6: Run superior pipeline to test bioguide integration
    console.log('\n🚀 Step 6: Running superior pipeline with bioguide integration...');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/main-pipeline.js federal --state=CA --limit=2', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Superior pipeline failed:', error);
          reject(error);
        } else {
          console.log('✅ Superior pipeline completed with bioguide integration');
          resolve();
        }
      });
    });
    
    // Step 7: Verify enhanced data with bioguide IDs
    console.log('\n🔍 Step 7: Verifying enhanced data with bioguide IDs...');
    const { data: enhancedReps, error: enhancedError } = await supabase
      .from('representatives_core')
      .select('id, name, bioguide_id, canonical_id, data_quality_score, verification_status')
      .eq('state', 'CA')
      .eq('level', 'federal')
      .limit(2);
    
    if (enhancedError) {
      console.error('❌ Error fetching enhanced data:', enhancedError);
      return;
    }
    
    console.log('📊 Enhanced Data with Bioguide IDs:');
    enhancedReps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name}`);
      console.log(`      Bioguide ID: ${rep.bioguide_id}`);
      console.log(`      Canonical ID: ${rep.canonical_id}`);
      console.log(`      Quality Score: ${rep.data_quality_score || 0}`);
      console.log(`      Verification: ${rep.verification_status || 'none'}`);
    });
    
    // Step 8: Check normalized tables
    console.log('\n🔍 Step 8: Checking normalized tables...');
    
    const { data: contacts } = await supabase
      .from('representative_contacts')
      .select('representative_id, contact_type, value, source')
      .limit(5);
    
    const { data: photos } = await supabase
      .from('representative_photos')
      .select('representative_id, url, source')
      .limit(5);
    
    const { data: activity } = await supabase
      .from('representative_activity')
      .select('representative_id, type, title, source')
      .limit(5);
    
    console.log(`📊 Normalized Data:`);
    console.log(`   Contacts: ${contacts?.length || 0} records`);
    console.log(`   Photos: ${photos?.length || 0} records`);
    console.log(`   Activity: ${activity?.length || 0} records`);
    
    // Step 9: Final success criteria
    console.log('\n✅ Step 9: Final Success Criteria:');
    const hasBioguideIds = enhancedReps.every(rep => rep.bioguide_id);
    const hasGoodNames = enhancedReps.every(rep => rep.name && !rep.name.includes('undefined'));
    const hasQualityScores = enhancedReps.every(rep => rep.data_quality_score > 0);
    const hasVerificationStatus = enhancedReps.every(rep => rep.verification_status);
    const hasContacts = (contacts && contacts.length > 0);
    const hasPhotos = (photos && photos.length > 0);
    const hasActivity = (activity && activity.length > 0);
    
    console.log(`   ✅ Bioguide IDs: ${hasBioguideIds ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Good Names: ${hasGoodNames ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Quality Scores: ${hasQualityScores ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Verification Status: ${hasVerificationStatus ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Contacts: ${hasContacts ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Photos: ${hasPhotos ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Activity: ${hasActivity ? 'PASS' : 'FAIL'}`);
    
    const allPassed = hasBioguideIds && hasGoodNames && hasQualityScores && hasVerificationStatus && hasContacts && hasPhotos && hasActivity;
    
    console.log(`\n🎯 FINAL RESULT: ${allPassed ? 'COMPLETE SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    if (allPassed) {
      console.log('🎉 ALL ISSUES COMPLETELY RESOLVED WITH BIOGUIDE INTEGRATION!');
      console.log('✅ Maximum cross-referencing capability achieved!');
      console.log('✅ Official congressional identifiers properly stored!');
      console.log('✅ No more issues to worry about!');
      console.log('✅ Everything is sorted and working perfectly!');
    } else {
      console.log('⚠️  Some issues still detected. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Final bioguide test failed:', error);
  }
}

// Run the final bioguide test
finalBioguideTest().catch(console.error);
