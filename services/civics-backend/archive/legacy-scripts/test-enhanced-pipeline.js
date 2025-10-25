#!/usr/bin/env node

/**
 * @fileoverview Test script for enhanced civics pipeline with data quality verification
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-10-25 - Enhanced with comprehensive data quality testing
 * @feature CIVICS_PIPELINE_TESTING
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Test the enhanced civics pipeline with data quality verification
 */
async function testEnhancedPipeline() {
  console.log('🧪 Testing Enhanced Civics Pipeline...\n');
  
  try {
    // Step 1: Clear existing test data for CA
    console.log('🧹 Clearing existing CA test data...');
    const { error: deleteError } = await supabase
      .from('representatives_core')
      .delete()
      .eq('state', 'CA')
      .eq('level', 'federal');
    
    if (deleteError) {
      console.log('⚠️  Error clearing data:', deleteError.message);
    } else {
      console.log('✅ Cleared existing CA data');
    }
    
    // Step 2: Run the basic fetch to get raw data
    console.log('\n📡 Running basic fetch for CA federal representatives...');
    const { exec } = require('child_process');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/fetch-current-federal-reps.js --state=CA --limit=5', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Basic fetch failed:', error);
          reject(error);
        } else {
          console.log('✅ Basic fetch completed');
          console.log('📊 Output:', stdout);
          resolve();
        }
      });
    });
    
    // Step 3: Check basic data quality
    console.log('\n🔍 Checking basic data quality...');
    const { data: basicReps, error: basicError } = await supabase
      .from('representatives_core')
      .select('id, name, party, data_quality_score, verification_status')
      .eq('state', 'CA')
      .eq('level', 'federal')
      .limit(5);
    
    if (basicError) {
      console.error('❌ Error fetching basic data:', basicError);
      return;
    }
    
    console.log('📊 Basic Data Quality:');
    basicReps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name} (${rep.party}) - Quality: ${rep.data_quality_score || 0} - Status: ${rep.verification_status || 'none'}`);
    });
    
    // Step 4: Run the superior pipeline to enhance data
    console.log('\n🚀 Running superior pipeline for enhancement...');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/main-pipeline.js federal --state=CA --limit=5', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Superior pipeline failed:', error);
          reject(error);
        } else {
          console.log('✅ Superior pipeline completed');
          console.log('📊 Output:', stdout);
          resolve();
        }
      });
    });
    
    // Step 5: Check enhanced data quality
    console.log('\n🔍 Checking enhanced data quality...');
    const { data: enhancedReps, error: enhancedError } = await supabase
      .from('representatives_core')
      .select('id, name, party, data_quality_score, verification_status')
      .eq('state', 'CA')
      .eq('level', 'federal')
      .limit(5);
    
    if (enhancedError) {
      console.error('❌ Error fetching enhanced data:', enhancedError);
      return;
    }
    
    console.log('📊 Enhanced Data Quality:');
    enhancedReps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name} (${rep.party})`);
      console.log(`      Quality: ${rep.data_quality_score || 0}`);
      console.log(`      Status: ${rep.verification_status || 'none'}`);
      console.log('');
    });
    
    // Step 6: Check normalized tables
    console.log('🔍 Checking normalized tables...');
    
    // Check contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('representative_contacts')
      .select('representative_id, contact_type, value, source')
      .limit(3);
    
    if (contactsError) {
      console.log('❌ Contacts error:', contactsError.message);
    } else {
      console.log(`📞 Contacts: ${contacts?.length || 0} records`);
      if (contacts && contacts.length > 0) {
        console.log('   Sample:', contacts[0]);
      }
    }
    
    // Check photos
    const { data: photos, error: photosError } = await supabase
      .from('representative_photos')
      .select('representative_id, url, source')
      .limit(3);
    
    if (photosError) {
      console.log('❌ Photos error:', photosError.message);
    } else {
      console.log(`📸 Photos: ${photos?.length || 0} records`);
      if (photos && photos.length > 0) {
        console.log('   Sample:', photos[0]);
      }
    }
    
    // Check activity
    const { data: activity, error: activityError } = await supabase
      .from('representative_activity')
      .select('representative_id, type, title, source')
      .limit(3);
    
    if (activityError) {
      console.log('❌ Activity error:', activityError.message);
    } else {
      console.log(`📋 Activity: ${activity?.length || 0} records`);
      if (activity && activity.length > 0) {
        console.log('   Sample:', activity[0]);
      }
    }
    
    // Step 7: Calculate overall quality metrics
    console.log('\n📈 Overall Quality Metrics:');
    const totalReps = enhancedReps.length;
    const avgQuality = enhancedReps.reduce((sum, rep) => sum + (rep.data_quality_score || 0), 0) / totalReps;
    const verified = enhancedReps.filter(rep => rep.verification_status === 'verified').length;
    const pending = enhancedReps.filter(rep => rep.verification_status === 'pending').length;
    const unverified = enhancedReps.filter(rep => rep.verification_status === 'unverified').length;
    const incomplete = enhancedReps.filter(rep => rep.verification_status === 'incomplete').length;
    
    console.log(`   Total Representatives: ${totalReps}`);
    console.log(`   Average Quality Score: ${avgQuality.toFixed(1)}`);
    console.log(`   Verified: ${verified}`);
    console.log(`   Pending: ${pending}`);
    console.log(`   Unverified: ${unverified}`);
    console.log(`   Incomplete: ${incomplete}`);
    
    // Step 8: Success criteria
    console.log('\n✅ Success Criteria:');
    const hasGoodNames = enhancedReps.every(rep => rep.name && !rep.name.includes('undefined'));
    const hasQualityScores = enhancedReps.every(rep => rep.data_quality_score > 0);
    const hasVerificationStatus = enhancedReps.every(rep => rep.verification_status);
    
    console.log(`   ✅ Good Names: ${hasGoodNames ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Quality Scores: ${hasQualityScores ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Verification Status: ${hasVerificationStatus ? 'PASS' : 'FAIL'}`);
    
    const allPassed = hasGoodNames && hasQualityScores && hasVerificationStatus;
    console.log(`\n🎯 Overall Result: ${allPassed ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    if (allPassed) {
      console.log('🎉 Enhanced civics pipeline is working perfectly!');
    } else {
      console.log('⚠️  Some issues detected. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEnhancedPipeline().catch(console.error);
