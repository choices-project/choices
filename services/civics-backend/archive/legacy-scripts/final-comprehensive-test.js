#!/usr/bin/env node

/**
 * @fileoverview Final comprehensive test for the complete civics pipeline
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_FINAL_TEST
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Final comprehensive test for the complete civics pipeline
 */
async function finalComprehensiveTest() {
  console.log('🎯 FINAL COMPREHENSIVE CIVICS PIPELINE TEST');
  console.log('==========================================\n');
  
  try {
    // Step 1: Clear all existing data to start fresh
    console.log('🧹 Step 1: Clearing all existing data...');
    const { error: deleteError } = await supabase
      .from('representatives_core')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (deleteError) {
      console.log('⚠️  Error clearing data:', deleteError.message);
    } else {
      console.log('✅ All existing data cleared');
    }
    
    // Step 2: Run basic fetch to get raw data
    console.log('\n📡 Step 2: Running basic fetch for CA federal representatives...');
    const { exec } = require('child_process');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/fetch-current-federal-reps.js --state=CA --limit=3', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Basic fetch failed:', error);
          reject(error);
        } else {
          console.log('✅ Basic fetch completed');
          resolve();
        }
      });
    });
    
    // Step 3: Verify basic data quality
    console.log('\n🔍 Step 3: Verifying basic data quality...');
    const { data: basicReps, error: basicError } = await supabase
      .from('representatives_core')
      .select('id, name, party, data_quality_score, verification_status')
      .eq('state', 'CA')
      .eq('level', 'federal')
      .limit(3);
    
    if (basicError) {
      console.error('❌ Error fetching basic data:', basicError);
      return;
    }
    
    console.log('📊 Basic Data Quality:');
    basicReps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name} (${rep.party}) - Quality: ${rep.data_quality_score || 0} - Status: ${rep.verification_status || 'none'}`);
    });
    
    // Step 4: Run superior pipeline to enhance data
    console.log('\n🚀 Step 4: Running superior pipeline for enhancement...');
    
    await new Promise((resolve, reject) => {
      exec('node scripts/main-pipeline.js federal --state=CA --limit=3', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Superior pipeline failed:', error);
          reject(error);
        } else {
          console.log('✅ Superior pipeline completed');
          resolve();
        }
      });
    });
    
    // Step 5: Verify enhanced data quality
    console.log('\n🔍 Step 5: Verifying enhanced data quality...');
    const { data: enhancedReps, error: enhancedError } = await supabase
      .from('representatives_core')
      .select('id, name, party, data_quality_score, verification_status')
      .eq('state', 'CA')
      .eq('level', 'federal')
      .limit(3);
    
    if (enhancedError) {
      console.error('❌ Error fetching enhanced data:', enhancedError);
      return;
    }
    
    console.log('📊 Enhanced Data Quality:');
    enhancedReps.forEach((rep, i) => {
      console.log(`   ${i+1}. ${rep.name} (${rep.party}) - Quality: ${rep.data_quality_score || 0} - Status: ${rep.verification_status || 'none'}`);
    });
    
    // Step 6: Check normalized tables
    console.log('\n🔍 Step 6: Checking normalized tables...');
    
    // Check contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('representative_contacts')
      .select('representative_id, contact_type, value, source')
      .limit(5);
    
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
      .limit(5);
    
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
      .limit(5);
    
    if (activityError) {
      console.log('❌ Activity error:', activityError.message);
    } else {
      console.log(`📋 Activity: ${activity?.length || 0} records`);
      if (activity && activity.length > 0) {
        console.log('   Sample:', activity[0]);
      }
    }
    
    // Step 7: Calculate final quality metrics
    console.log('\n📈 Step 7: Final Quality Metrics:');
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
    
    // Step 8: Final success criteria
    console.log('\n✅ Step 8: Final Success Criteria:');
    const hasGoodNames = enhancedReps.every(rep => rep.name && !rep.name.includes('undefined'));
    const hasQualityScores = enhancedReps.every(rep => rep.data_quality_score > 0);
    const hasVerificationStatus = enhancedReps.every(rep => rep.verification_status);
    const hasContacts = (contacts && contacts.length > 0);
    const hasPhotos = (photos && photos.length > 0);
    const hasActivity = (activity && activity.length > 0);
    
    console.log(`   ✅ Good Names: ${hasGoodNames ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Quality Scores: ${hasQualityScores ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Verification Status: ${hasVerificationStatus ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Contacts: ${hasContacts ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Photos: ${hasPhotos ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Activity: ${hasActivity ? 'PASS' : 'FAIL'}`);
    
    const allPassed = hasGoodNames && hasQualityScores && hasVerificationStatus && hasContacts && hasPhotos && hasActivity;
    
    console.log(`\n🎯 FINAL RESULT: ${allPassed ? 'COMPLETE SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    if (allPassed) {
      console.log('🎉 ALL ISSUES COMPLETELY RESOLVED!');
      console.log('✅ The civics pipeline is working perfectly!');
      console.log('✅ No more issues to worry about!');
    } else {
      console.log('⚠️  Some issues still detected. Check the logs above for details.');
    }
    
    // Step 9: Show final data sample
    console.log('\n📊 Step 9: Final Data Sample:');
    if (enhancedReps.length > 0) {
      const sampleRep = enhancedReps[0];
      console.log(`   Representative: ${sampleRep.name}`);
      console.log(`   Party: ${sampleRep.party}`);
      console.log(`   Quality Score: ${sampleRep.data_quality_score}`);
      console.log(`   Verification Status: ${sampleRep.verification_status}`);
      
      // Show associated data
      const repContacts = contacts?.filter(c => c.representative_id === sampleRep.id) || [];
      const repPhotos = photos?.filter(p => p.representative_id === sampleRep.id) || [];
      const repActivity = activity?.filter(a => a.representative_id === sampleRep.id) || [];
      
      console.log(`   Contacts: ${repContacts.length}`);
      console.log(`   Photos: ${repPhotos.length}`);
      console.log(`   Activity: ${repActivity.length}`);
    }
    
  } catch (error) {
    console.error('❌ Final test failed:', error);
  }
}

// Run the final test
finalComprehensiveTest().catch(console.error);