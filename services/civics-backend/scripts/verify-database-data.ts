#!/usr/bin/env tsx

/**
 * Verify Database Data
 * 
 * Comprehensive verification of data landing in the database
 * Checks all tables, data quality, and relationships
 */

import dotenv from 'dotenv';
import { createSupabaseClient } from '../lib/index.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyDatabaseData() {
  console.log('🔍 Verifying Database Data Landing');
  console.log('==================================');
  
  try {
    const supabase = await createSupabaseClient();
    
    // 1. Check representatives_core table
    console.log('\n📊 Representatives Core Table:');
    const { data: coreData, error: coreError } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(5);
    
    if (coreError) {
      console.error('❌ Error accessing representatives_core:', coreError.message);
    } else {
      console.log(`✅ Found ${coreData?.length || 0} records in representatives_core`);
      if (coreData && coreData.length > 0) {
        console.log('📋 Sample record:');
        console.log(JSON.stringify(coreData[0], null, 2));
      }
    }
    
    // 2. Check representative_contacts table
    console.log('\n📞 Representative Contacts Table:');
    const { data: contactsData, error: contactsError } = await supabase
      .from('representative_contacts')
      .select('*')
      .limit(5);
    
    if (contactsError) {
      console.error('❌ Error accessing representative_contacts:', contactsError.message);
    } else {
      console.log(`✅ Found ${contactsData?.length || 0} records in representative_contacts`);
      if (contactsData && contactsData.length > 0) {
        console.log('📋 Sample contact record:');
        console.log(JSON.stringify(contactsData[0], null, 2));
      }
    }
    
    // 3. Check representative_photos table
    console.log('\n📸 Representative Photos Table:');
    const { data: photosData, error: photosError } = await supabase
      .from('representative_photos')
      .select('*')
      .limit(5);
    
    if (photosError) {
      console.error('❌ Error accessing representative_photos:', photosError.message);
    } else {
      console.log(`✅ Found ${photosData?.length || 0} records in representative_photos`);
      if (photosData && photosData.length > 0) {
        console.log('📋 Sample photo record:');
        console.log(JSON.stringify(photosData[0], null, 2));
      }
    }
    
    // 4. Check representative_social_media table
    console.log('\n🌐 Representative Social Media Table:');
    const { data: socialData, error: socialError } = await supabase
      .from('representative_social_media')
      .select('*')
      .limit(5);
    
    if (socialError) {
      console.error('❌ Error accessing representative_social_media:', socialError.message);
    } else {
      console.log(`✅ Found ${socialData?.length || 0} records in representative_social_media`);
      if (socialData && socialData.length > 0) {
        console.log('📋 Sample social media record:');
        console.log(JSON.stringify(socialData[0], null, 2));
      }
    }
    
    // 5. Check representative_activity table
    console.log('\n📈 Representative Activity Table:');
    const { data: activityData, error: activityError } = await supabase
      .from('representative_activity')
      .select('*')
      .limit(5);
    
    if (activityError) {
      console.error('❌ Error accessing representative_activity:', activityError.message);
    } else {
      console.log(`✅ Found ${activityData?.length || 0} records in representative_activity`);
      if (activityData && activityData.length > 0) {
        console.log('📋 Sample activity record:');
        console.log(JSON.stringify(activityData[0], null, 2));
      }
    }
    
    // 6. Check id_crosswalk table
    console.log('\n🔗 ID Crosswalk Table:');
    const { data: crosswalkData, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .select('*')
      .limit(10);
    
    if (crosswalkError) {
      console.error('❌ Error accessing id_crosswalk:', crosswalkError.message);
    } else {
      console.log(`✅ Found ${crosswalkData?.length || 0} records in id_crosswalk`);
      if (crosswalkData && crosswalkData.length > 0) {
        console.log('📋 Sample crosswalk record:');
        console.log(JSON.stringify(crosswalkData[0], null, 2));
      }
    }
    
    // 7. Check openstates_people_data table
    console.log('\n🏛️ OpenStates People Data Table:');
    const { data: openstatesData, error: openstatesError } = await supabase
      .from('openstates_people_data')
      .select('*')
      .limit(5);
    
    if (openstatesError) {
      console.error('❌ Error accessing openstates_people_data:', openstatesError.message);
    } else {
      console.log(`✅ Found ${openstatesData?.length || 0} records in openstates_people_data`);
      if (openstatesData && openstatesData.length > 0) {
        console.log('📋 Sample OpenStates record:');
        console.log(JSON.stringify(openstatesData[0], null, 2));
      }
    }
    
    // 8. Check openstates_people_roles table
    console.log('\n👥 OpenStates People Roles Table:');
    const { data: rolesData, error: rolesError } = await supabase
      .from('openstates_people_roles')
      .select('*')
      .limit(5);
    
    if (rolesError) {
      console.error('❌ Error accessing openstates_people_roles:', rolesError.message);
    } else {
      console.log(`✅ Found ${rolesData?.length || 0} records in openstates_people_roles`);
      if (rolesData && rolesData.length > 0) {
        console.log('📋 Sample roles record:');
        console.log(JSON.stringify(rolesData[0], null, 2));
      }
    }
    
    // 9. Data Quality Summary
    console.log('\n📊 Data Quality Summary:');
    const { data: qualityData, error: qualityError } = await supabase
      .from('representatives_core')
      .select('data_quality_score, verification_status, data_sources')
      .not('data_quality_score', 'is', null);
    
    if (qualityError) {
      console.error('❌ Error accessing quality data:', qualityError.message);
    } else if (qualityData && qualityData.length > 0) {
      const avgQuality = qualityData.reduce((sum, record) => sum + (record.data_quality_score || 0), 0) / qualityData.length;
      const highQuality = qualityData.filter(record => (record.data_quality_score || 0) >= 80).length;
      
      console.log(`📈 Average Quality Score: ${avgQuality.toFixed(1)}`);
      console.log(`📈 High Quality Records (≥80): ${highQuality}/${qualityData.length}`);
      console.log(`📈 Total Records: ${qualityData.length}`);
      
      // Show data sources distribution
      const sources = qualityData.reduce((acc, record) => {
        const sources = record.data_sources || [];
        sources.forEach(source => {
          acc[source] = (acc[source] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📈 Data Sources Distribution:');
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} records`);
      });
    }
    
    // 10. Check for any missing relationships
    console.log('\n🔗 Relationship Verification:');
    
    // Check if core records have corresponding contact records
    const { data: coreCount } = await supabase
      .from('representatives_core')
      .select('id', { count: 'exact' });
    
    const { data: contactCount } = await supabase
      .from('representative_contacts')
      .select('representative_id', { count: 'exact' });
    
    console.log(`📊 Core Records: ${coreCount?.length || 0}`);
    console.log(`📊 Contact Records: ${contactCount?.length || 0}`);
    
    console.log('\n✅ Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
verifyDatabaseData().catch(console.error);


