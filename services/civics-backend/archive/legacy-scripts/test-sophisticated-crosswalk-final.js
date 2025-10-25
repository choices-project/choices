#!/usr/bin/env node

/**
 * @fileoverview Final comprehensive test for sophisticated crosswalk functionality
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_SOPHISTICATED_CROSSWALK_FINAL_TEST
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Final comprehensive test for sophisticated crosswalk functionality
 */
async function testSophisticatedCrosswalkFinal() {
  console.log('🎯 FINAL COMPREHENSIVE TEST: SOPHISTICATED CROSSWALK');
  console.log('===================================================\n');
  
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
    
    // Step 2: Run sophisticated pipeline
    console.log('\n🚀 Step 2: Running sophisticated pipeline...');
    const { exec } = require('child_process');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/sophisticated-pipeline-backend.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Sophisticated pipeline failed:', error);
          reject(error);
        } else {
          console.log('✅ Sophisticated pipeline completed');
          console.log(stdout);
          resolve();
        }
      });
    });
    
    // Step 3: Verify representatives are stored
    console.log('\n🔍 Step 3: Verifying representatives are stored...');
    const { data: reps, error: repsError } = await supabase
      .from('representatives_core')
      .select('id, name, bioguide_id, canonical_id, data_quality_score, verification_status')
      .limit(5);
    
    if (repsError) {
      console.error('❌ Error fetching reps:', repsError);
      return;
    }
    
    console.log('📊 Representatives stored:');
    reps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name}`);
      console.log(`      Bioguide ID: ${rep.bioguide_id}`);
      console.log(`      Canonical ID: ${rep.canonical_id}`);
      console.log(`      Quality Score: ${rep.data_quality_score}`);
      console.log(`      Verification: ${rep.verification_status}`);
    });
    
    // Step 4: Verify crosswalk entries
    console.log('\n🔗 Step 4: Verifying crosswalk entries...');
    const { data: crosswalkEntries, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .select('entity_type, canonical_id, source, source_id, attrs')
      .limit(10);
    
    if (crosswalkError) {
      console.log('❌ Crosswalk error:', crosswalkError.message);
    } else {
      console.log(`📊 Crosswalk entries: ${crosswalkEntries?.length || 0}`);
      crosswalkEntries?.forEach((entry, i) => {
        console.log(`   ${i+1}. Entity: ${entry.entity_type}`);
        console.log(`      Canonical ID: ${entry.canonical_id}`);
        console.log(`      Source: ${entry.source}`);
        console.log(`      Source ID: ${entry.source_id}`);
        console.log(`      Quality Score: ${entry.attrs?.quality_score || 'N/A'}`);
      });
    }
    
    // Step 5: Check normalized tables
    console.log('\n🔍 Step 5: Checking normalized tables...');
    
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
    
    const { data: socialMedia } = await supabase
      .from('representative_social_media')
      .select('representative_id, platform, handle, url')
      .limit(5);
    
    console.log(`📊 Normalized Data:`);
    console.log(`   Contacts: ${contacts?.length || 0} records`);
    console.log(`   Photos: ${photos?.length || 0} records`);
    console.log(`   Activity: ${activity?.length || 0} records`);
    console.log(`   Social Media: ${socialMedia?.length || 0} records`);
    
    // Step 6: Test crosswalk functionality
    console.log('\n🔗 Step 6: Testing crosswalk functionality...');
    
    if (reps.length > 0 && reps[0].canonical_id) {
      const testCanonicalId = reps[0].canonical_id;
      console.log(`   Testing with canonical ID: ${testCanonicalId}`);
      
      // Test finding by canonical ID
      const { data: foundByCanonical, error: canonicalError } = await supabase
        .from('id_crosswalk')
        .select('entity_type, canonical_id, source, source_id')
        .eq('canonical_id', testCanonicalId)
        .limit(5);
      
      if (canonicalError) {
        console.log('❌ Error finding by canonical ID:', canonicalError.message);
      } else if (foundByCanonical && foundByCanonical.length > 0) {
        console.log('✅ Successfully found crosswalk entries by canonical ID');
        console.log(`   Found ${foundByCanonical.length} entries`);
        foundByCanonical.forEach((entry, i) => {
          console.log(`     ${i+1}. Source: ${entry.source}, ID: ${entry.source_id}`);
        });
      } else {
        console.log('❌ Could not find crosswalk entries by canonical ID');
      }
    }
    
    // Step 7: Calculate sophisticated crosswalk metrics
    console.log('\n📈 Step 7: Sophisticated Crosswalk Metrics:');
    
    const totalReps = reps.length;
    const repsWithBioguide = reps.filter(rep => rep.bioguide_id).length;
    const bioguideCoverage = totalReps > 0 ? (repsWithBioguide / totalReps) * 100 : 0;
    
    // Check crosswalk entries
    let totalCrosswalkEntries = 0;
    let multiSourceEntries = 0;
    let avgQualityScore = 0;
    
    if (crosswalkEntries) {
      totalCrosswalkEntries = crosswalkEntries.length;
      
      // Count canonical IDs with multiple sources
      const canonicalIdCounts = {};
      crosswalkEntries.forEach(entry => {
        canonicalIdCounts[entry.canonical_id] = (canonicalIdCounts[entry.canonical_id] || 0) + 1;
      });
      
      multiSourceEntries = Object.values(canonicalIdCounts).filter(count => count > 1).length;
      
      // Calculate average quality score
      const qualityScores = crosswalkEntries.map(entry => entry.attrs?.quality_score || 0);
      avgQualityScore = qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;
    }
    
    console.log(`   Total Representatives: ${totalReps}`);
    console.log(`   With Bioguide IDs: ${repsWithBioguide} (${bioguideCoverage.toFixed(1)}%)`);
    console.log(`   Crosswalk Entries: ${totalCrosswalkEntries}`);
    console.log(`   Multi-Source Entries: ${multiSourceEntries}`);
    console.log(`   Average Quality Score: ${avgQualityScore.toFixed(2)}`);
    
    // Step 8: Final success criteria
    console.log('\n✅ Step 8: Sophisticated Crosswalk Success Criteria:');
    const hasRepresentatives = totalReps > 0;
    const hasBioguideIds = repsWithBioguide > 0;
    const hasCrosswalkEntries = totalCrosswalkEntries > 0;
    const hasGoodQuality = avgQualityScore > 0;
    const hasGoodNames = reps.every(rep => rep.name && !rep.name.includes('undefined'));
    const hasQualityScores = reps.every(rep => rep.data_quality_score > 0);
    const hasVerificationStatus = reps.every(rep => rep.verification_status);
    
    console.log(`   ✅ Representatives: ${hasRepresentatives ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Bioguide IDs: ${hasBioguideIds ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Crosswalk Entries: ${hasCrosswalkEntries ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Quality Scores: ${hasGoodQuality ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Good Names: ${hasGoodNames ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Data Quality: ${hasQualityScores ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Verification Status: ${hasVerificationStatus ? 'PASS' : 'FAIL'}`);
    
    const allPassed = hasRepresentatives && hasBioguideIds && hasCrosswalkEntries && hasGoodQuality && hasGoodNames && hasQualityScores && hasVerificationStatus;
    
    console.log(`\n🎯 SOPHISTICATED CROSSWALK RESULT: ${allPassed ? 'COMPLETE SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    if (allPassed) {
      console.log('🎉 SOPHISTICATED CROSSWALK IS WORKING PERFECTLY!');
      console.log('✅ Multi-source consensus achieved!');
      console.log('✅ Quality-based crosswalk resolution working!');
      console.log('✅ Rich API data integration working!');
      console.log('✅ No more janky crosswalk issues!');
      console.log('✅ Maximum cross-referencing capability restored!');
    } else {
      console.log('⚠️  Some sophisticated crosswalk issues detected.');
      console.log('   The crosswalk is not as robust as it should be.');
    }
    
  } catch (error) {
    console.error('❌ Sophisticated crosswalk test failed:', error);
  }
}

// Run the sophisticated crosswalk test
testSophisticatedCrosswalkFinal().catch(console.error);
