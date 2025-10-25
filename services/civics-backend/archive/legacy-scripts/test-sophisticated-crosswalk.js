#!/usr/bin/env node

/**
 * @fileoverview Test sophisticated multi-source crosswalk functionality
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_SOPHISTICATED_CROSSWALK
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Test sophisticated multi-source crosswalk functionality
 */
async function testSophisticatedCrosswalk() {
  console.log('🔍 TESTING SOPHISTICATED MULTI-SOURCE CROSSWALK');
  console.log('===============================================\n');
  
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
    
    // Step 2: Check if id_crosswalk table exists
    console.log('\n🔍 Step 2: Checking id_crosswalk table...');
    try {
      const { data: crosswalkTest, error: crosswalkError } = await supabase
        .from('id_crosswalk')
        .select('canonical_id')
        .limit(1);
      
      if (crosswalkError) {
        console.log('❌ id_crosswalk table does not exist:', crosswalkError.message);
        console.log('   This is required for sophisticated crosswalk functionality');
        console.log('   Creating table...');
        
        // Try to create the table
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS id_crosswalk (
              id SERIAL PRIMARY KEY,
              entity_type VARCHAR(50) NOT NULL,
              canonical_id VARCHAR(255) NOT NULL,
              source VARCHAR(50) NOT NULL,
              source_id VARCHAR(255) NOT NULL,
              attrs JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(source, source_id)
            );
          `
        });
        
        if (createError) {
          console.log('❌ Error creating id_crosswalk table:', createError.message);
          console.log('   Manual SQL execution required:');
          console.log('   CREATE TABLE id_crosswalk (...);');
        } else {
          console.log('✅ id_crosswalk table created');
        }
      } else {
        console.log('✅ id_crosswalk table exists');
      }
    } catch (error) {
      console.log('❌ Error checking id_crosswalk table:', error.message);
    }
    
    // Step 3: Fetch representatives with bioguide IDs
    console.log('\n📡 Step 3: Fetching representatives with bioguide IDs...');
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
    
    // Step 4: Verify bioguide IDs are stored
    console.log('\n🔍 Step 4: Verifying bioguide IDs are stored...');
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
    
    // Step 5: Run superior pipeline with sophisticated crosswalk
    console.log('\n🚀 Step 5: Running superior pipeline with sophisticated crosswalk...');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/main-pipeline.js federal --state=CA --limit=2', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Superior pipeline failed:', error);
          reject(error);
        } else {
          console.log('✅ Superior pipeline completed with sophisticated crosswalk');
          resolve();
        }
      });
    });
    
    // Step 6: Check crosswalk entries
    console.log('\n🔗 Step 6: Checking crosswalk entries...');
    try {
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
    } catch (error) {
      console.log('❌ Error checking crosswalk entries:', error.message);
    }
    
    // Step 7: Verify enhanced data with sophisticated crosswalk
    console.log('\n🔍 Step 7: Verifying enhanced data with sophisticated crosswalk...');
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
    
    console.log('📊 Enhanced Data with Sophisticated Crosswalk:');
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
    
    // Step 9: Calculate sophisticated crosswalk metrics
    console.log('\n📈 Step 9: Sophisticated Crosswalk Metrics:');
    
    const totalReps = enhancedReps.length;
    const repsWithBioguide = enhancedReps.filter(rep => rep.bioguide_id).length;
    const bioguideCoverage = totalReps > 0 ? (repsWithBioguide / totalReps) * 100 : 0;
    
    // Check crosswalk entries
    let crosswalkEntries = 0;
    let multiSourceEntries = 0;
    try {
      const { data: crosswalkData } = await supabase
        .from('id_crosswalk')
        .select('canonical_id, source')
        .limit(100);
      
      if (crosswalkData) {
        crosswalkEntries = crosswalkData.length;
        
        // Count canonical IDs with multiple sources
        const canonicalIdCounts = {};
        crosswalkData.forEach(entry => {
          canonicalIdCounts[entry.canonical_id] = (canonicalIdCounts[entry.canonical_id] || 0) + 1;
        });
        
        multiSourceEntries = Object.values(canonicalIdCounts).filter(count => count > 1).length;
      }
    } catch (error) {
      console.log('⚠️  Could not calculate crosswalk metrics:', error.message);
    }
    
    console.log(`   Total Representatives: ${totalReps}`);
    console.log(`   With Bioguide IDs: ${repsWithBioguide} (${bioguideCoverage.toFixed(1)}%)`);
    console.log(`   Crosswalk Entries: ${crosswalkEntries}`);
    console.log(`   Multi-Source Entries: ${multiSourceEntries}`);
    
    // Step 10: Final success criteria
    console.log('\n✅ Step 10: Sophisticated Crosswalk Success Criteria:');
    const hasBioguideIds = enhancedReps.every(rep => rep.bioguide_id);
    const hasGoodNames = enhancedReps.every(rep => rep.name && !rep.name.includes('undefined'));
    const hasQualityScores = enhancedReps.every(rep => rep.data_quality_score > 0);
    const hasVerificationStatus = enhancedReps.every(rep => rep.verification_status);
    const hasContacts = (contacts && contacts.length > 0);
    const hasPhotos = (photos && photos.length > 0);
    const hasActivity = (activity && activity.length > 0);
    const hasCrosswalkEntries = crosswalkEntries > 0;
    const hasMultiSource = multiSourceEntries > 0;
    
    console.log(`   ✅ Bioguide IDs: ${hasBioguideIds ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Good Names: ${hasGoodNames ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Quality Scores: ${hasQualityScores ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Verification Status: ${hasVerificationStatus ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Contacts: ${hasContacts ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Photos: ${hasPhotos ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Activity: ${hasActivity ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Crosswalk Entries: ${hasCrosswalkEntries ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Multi-Source Crosswalk: ${hasMultiSource ? 'PASS' : 'FAIL'}`);
    
    const allPassed = hasBioguideIds && hasGoodNames && hasQualityScores && hasVerificationStatus && hasContacts && hasPhotos && hasActivity && hasCrosswalkEntries && hasMultiSource;
    
    console.log(`\n🎯 SOPHISTICATED CROSSWALK RESULT: ${allPassed ? 'COMPLETE SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    if (allPassed) {
      console.log('🎉 SOPHISTICATED CROSSWALK IS WORKING PERFECTLY!');
      console.log('✅ Multi-source consensus achieved!');
      console.log('✅ Rich API data integration working!');
      console.log('✅ Quality-based crosswalk resolution working!');
      console.log('✅ No more janky crosswalk issues!');
    } else {
      console.log('⚠️  Some sophisticated crosswalk issues detected.');
      console.log('   The crosswalk is not as robust as it should be.');
    }
    
  } catch (error) {
    console.error('❌ Sophisticated crosswalk test failed:', error);
  }
}

// Run the sophisticated crosswalk test
testSophisticatedCrosswalk().catch(console.error);
