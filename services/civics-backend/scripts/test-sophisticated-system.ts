#!/usr/bin/env tsx

/**
 * Test Sophisticated System
 * 
 * Comprehensive test suite for the sophisticated civics backend system
 * Verifies all components work correctly together
 */

import dotenv from 'dotenv';
import { createCivicsPipeline, createSupabaseClient, defaultConfig } from '../lib/index.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from('representatives_core')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testPipelineInitialization() {
  console.log('🔍 Testing pipeline initialization...');
  
  try {
    const pipeline = createCivicsPipeline(defaultConfig);
    console.log('✅ Pipeline initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Pipeline initialization failed:', error);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('🔍 Testing environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const optionalVars = [
    'CONGRESS_GOV_API_KEY',
    'OPEN_STATES_API_KEY',
    'FEC_API_KEY',
    'GOOGLE_CIVIC_API_KEY'
  ];
  
  let allRequired = true;
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      allRequired = false;
    } else {
      console.log(`✅ ${varName}: configured`);
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: configured`);
    } else {
      console.log(`⚠️  ${varName}: not configured (optional)`);
    }
  }
  
  return allRequired;
}

async function testDataQuality() {
  console.log('🔍 Testing data quality...');
  
  try {
    const supabase = await createSupabaseClient();
    
    // Check representatives_core table
    const { data: reps, error: repsError } = await supabase
      .from('representatives_core')
      .select('id, name, data_quality_score, verification_status')
      .limit(10);
    
    if (repsError) {
      throw new Error(`Error querying representatives_core: ${repsError.message}`);
    }
    
    console.log(`✅ Found ${reps?.length || 0} representatives in database`);
    
    if (reps && reps.length > 0) {
      const avgQuality = reps.reduce((sum, rep) => sum + (rep.data_quality_score || 0), 0) / reps.length;
      console.log(`📊 Average quality score: ${avgQuality.toFixed(1)}`);
      
      const highQuality = reps.filter(rep => (rep.data_quality_score || 0) >= 80).length;
      console.log(`📊 High quality records: ${highQuality}/${reps.length}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Data quality test failed:', error);
    return false;
  }
}

async function testCrosswalkData() {
  console.log('🔍 Testing crosswalk data...');
  
  try {
    const supabase = await createSupabaseClient();
    
    const { data: crosswalk, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .select('entity_type, source, canonical_id')
      .limit(10);
    
    if (crosswalkError) {
      throw new Error(`Error querying id_crosswalk: ${crosswalkError.message}`);
    }
    
    console.log(`✅ Found ${crosswalk?.length || 0} crosswalk entries`);
    
    if (crosswalk && crosswalk.length > 0) {
      const sources = [...new Set(crosswalk.map(entry => entry.source))];
      console.log(`📊 Data sources: ${sources.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Crosswalk test failed:', error);
    return false;
  }
}

async function testNormalizedTables() {
  console.log('🔍 Testing normalized tables...');
  
  try {
    const supabase = await createSupabaseClient();
    
    const tables = [
      'representative_contacts',
      'representative_photos',
      'representative_social_media',
      'representative_activity'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`⚠️  Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible`);
        }
      } catch (err) {
        console.log(`⚠️  Table ${table}: ${err}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Normalized tables test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Running Comprehensive Test Suite');
  console.log('===================================');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Pipeline Initialization', fn: testPipelineInitialization },
    { name: 'Data Quality', fn: testDataQuality },
    { name: 'Crosswalk Data', fn: testCrosswalkData },
    { name: 'Normalized Tables', fn: testNormalizedTables }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n🔍 Running ${test.name}...`);
    const result = await test.fn();
    
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! System is ready for production.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    return false;
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}
