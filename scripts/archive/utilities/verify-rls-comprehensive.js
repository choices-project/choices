#!/usr/bin/env node

/**
 * Comprehensive RLS Verification Script
 * 
 * This script tests data ingress and egress with proper authentication
 * to ensure RLS policies work correctly for all scenarios.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure all required Supabase keys are set in web/.env.local');
  process.exit(1);
}

// Create clients for different authentication contexts
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testServiceRoleAccess() {
  console.log('🔧 Testing Service Role Access...');
  
  const results = {
    tablesTested: 0,
    tablesPassed: 0,
    tablesFailed: 0,
    errors: []
  };

  // Tables that should be accessible with service role
  const serviceRoleTables = [
    'representatives_core',
    'representative_contacts',
    'representative_photos',
    'representative_activity',
    'representative_social_media',
    'representative_committees',
    'openstates_people_data',
    'openstates_people_contacts',
    'openstates_people_identifiers',
    'openstates_people_other_names',
    'openstates_people_roles',
    'openstates_people_social_media',
    'openstates_people_sources',
    'id_crosswalk',
    'analytics_events',
    'analytics_event_data',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
    'message_delivery_logs',
    'civic_action_metadata'
  ];

  for (const tableName of serviceRoleTables) {
    console.log(`📋 Testing service role access to: ${tableName}`);
    results.tablesTested++;

    try {
      const { data, error } = await serviceClient
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Service role access failed for ${tableName}: ${error.message}`);
        results.tablesFailed++;
        results.errors.push(`Service role access failed for ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Service role access successful for ${tableName}`);
        results.tablesPassed++;
      }
    } catch (error) {
      console.log(`❌ Service role access error for ${tableName}: ${error.message}`);
      results.tablesFailed++;
      results.errors.push(`Service role access error for ${tableName}: ${error.message}`);
    }
  }

  return results;
}

async function testAnonUserAccess() {
  console.log('👤 Testing Anonymous User Access...');
  
  const results = {
    tablesTested: 0,
    tablesPassed: 0,
    tablesFailed: 0,
    errors: []
  };

  // Tables that should be accessible to anonymous users (public read)
  const publicReadTables = [
    'representatives_core',
    'representative_contacts',
    'representative_photos',
    'representative_activity',
    'representative_social_media',
    'representative_committees',
    'polls',
    'poll_options',
    'hashtags',
    'hashtag_usage',
    'hashtag_flags'
  ];

  for (const tableName of publicReadTables) {
    console.log(`📋 Testing anonymous access to: ${tableName}`);
    results.tablesTested++;

    try {
      const { data, error } = await anonClient
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Anonymous access failed for ${tableName}: ${error.message}`);
        results.tablesFailed++;
        results.errors.push(`Anonymous access failed for ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Anonymous access successful for ${tableName}`);
        results.tablesPassed++;
      }
    } catch (error) {
      console.log(`❌ Anonymous access error for ${tableName}: ${error.message}`);
      results.tablesFailed++;
      results.errors.push(`Anonymous access error for ${tableName}: ${error.message}`);
    }
  }

  return results;
}

async function testAnonUserWriteAccess() {
  console.log('👤 Testing Anonymous User Write Access (Should Fail)...');
  
  const results = {
    tablesTested: 0,
    tablesBlocked: 0,
    tablesAllowed: 0,
    errors: []
  };

  // Tables that should block anonymous write access
  const protectedWriteTables = [
    'user_profiles',
    'votes',
    'user_hashtags',
    'feedback',
    'polls',
    'poll_options',
    'hashtags'
  ];

  for (const tableName of protectedWriteTables) {
    console.log(`📋 Testing anonymous write to: ${tableName}`);
    results.tablesTested++;

    try {
      const { data, error } = await anonClient
        .from(tableName)
        .insert({ test: 'data' });

      if (error) {
        console.log(`✅ Anonymous write blocked for ${tableName}: ${error.message}`);
        results.tablesBlocked++;
      } else {
        console.log(`❌ Anonymous write allowed for ${tableName} (should be blocked)`);
        results.tablesAllowed++;
        results.errors.push(`Anonymous write allowed for ${tableName} (should be blocked)`);
      }
    } catch (error) {
      console.log(`✅ Anonymous write blocked for ${tableName}: ${error.message}`);
      results.tablesBlocked++;
    }
  }

  return results;
}

async function testDataIngress() {
  console.log('📥 Testing Data Ingress with Service Role...');
  
  const results = {
    operationsTested: 0,
    operationsPassed: 0,
    operationsFailed: 0,
    errors: []
  };

  // Test inserting representative data
  try {
    console.log('📋 Testing representative data insertion...');
    results.operationsTested++;

    const { data, error } = await serviceClient
      .from('representatives_core')
      .insert({
        name: 'Test Representative',
        office: 'Representative',
        level: 'federal',
        state: 'CA',
        party: 'Test Party',
        district: '1',
        is_active: true
      })
      .select();

    if (error) {
      console.log(`❌ Representative insertion failed: ${error.message}`);
      results.operationsFailed++;
      results.errors.push(`Representative insertion failed: ${error.message}`);
    } else {
      console.log(`✅ Representative insertion successful`);
      results.operationsPassed++;
      
      // Clean up test data
      if (data && data.length > 0) {
        await serviceClient
          .from('representatives_core')
          .delete()
          .eq('id', data[0].id);
        console.log(`🧹 Cleaned up test representative data`);
      }
    }
  } catch (error) {
    console.log(`❌ Representative insertion error: ${error.message}`);
    results.operationsFailed++;
    results.errors.push(`Representative insertion error: ${error.message}`);
  }

  // Test inserting ID crosswalk data
  try {
    console.log('📋 Testing ID crosswalk data insertion...');
    results.operationsTested++;

    const { data, error } = await serviceClient
      .from('id_crosswalk')
      .insert({
        entity_type: 'person',
        canonical_id: 'test-canonical-id',
        source: 'test-source',
        source_id: 'test-source-id',
        attrs: { test: true }
      })
      .select();

    if (error) {
      console.log(`❌ ID crosswalk insertion failed: ${error.message}`);
      results.operationsFailed++;
      results.errors.push(`ID crosswalk insertion failed: ${error.message}`);
    } else {
      console.log(`✅ ID crosswalk insertion successful`);
      results.operationsPassed++;
      
      // Clean up test data
      if (data && data.length > 0) {
        await serviceClient
          .from('id_crosswalk')
          .delete()
          .eq('id', data[0].id);
        console.log(`🧹 Cleaned up test ID crosswalk data`);
      }
    }
  } catch (error) {
    console.log(`❌ ID crosswalk insertion error: ${error.message}`);
    results.operationsFailed++;
    results.errors.push(`ID crosswalk insertion error: ${error.message}`);
  }

  return results;
}

async function testDataEgress() {
  console.log('📤 Testing Data Egress with Anonymous User...');
  
  const results = {
    operationsTested: 0,
    operationsPassed: 0,
    operationsFailed: 0,
    errors: []
  };

  // Test reading representative data
  try {
    console.log('📋 Testing representative data reading...');
    results.operationsTested++;

    const { data, error } = await anonClient
      .from('representatives_core')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`❌ Representative reading failed: ${error.message}`);
      results.operationsFailed++;
      results.errors.push(`Representative reading failed: ${error.message}`);
    } else {
      console.log(`✅ Representative reading successful (${data?.length || 0} records)`);
      results.operationsPassed++;
    }
  } catch (error) {
    console.log(`❌ Representative reading error: ${error.message}`);
    results.operationsFailed++;
    results.errors.push(`Representative reading error: ${error.message}`);
  }

  // Test reading polls data
  try {
    console.log('📋 Testing polls data reading...');
    results.operationsTested++;

    const { data, error } = await anonClient
      .from('polls')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`❌ Polls reading failed: ${error.message}`);
      results.operationsFailed++;
      results.errors.push(`Polls reading failed: ${error.message}`);
    } else {
      console.log(`✅ Polls reading successful (${data?.length || 0} records)`);
      results.operationsPassed++;
    }
  } catch (error) {
    console.log(`❌ Polls reading error: ${error.message}`);
    results.operationsFailed++;
    results.errors.push(`Polls reading error: ${error.message}`);
  }

  return results;
}

async function runComprehensiveVerification() {
  console.log('🚀 Starting comprehensive RLS verification...');
  
  const results = {
    serviceRoleAccess: await testServiceRoleAccess(),
    anonUserAccess: await testAnonUserAccess(),
    anonUserWriteAccess: await testAnonUserWriteAccess(),
    dataIngress: await testDataIngress(),
    dataEgress: await testDataEgress()
  };

  return results;
}

async function generateComprehensiveReport(results) {
  const report = `# 🔒 Comprehensive RLS Verification Report

**Date**: ${new Date().toISOString().split('T')[0]}  
**Status**: ${Object.values(results).every(r => r.errors?.length === 0) ? '✅ SUCCESS' : '⚠️ PARTIAL SUCCESS'}  
**Purpose**: Comprehensive RLS verification for data ingress and egress

---

## 📊 **RESULTS SUMMARY**

### **Service Role Access:**
- **Tables Tested**: ${results.serviceRoleAccess.tablesTested}
- **Tables Passed**: ${results.serviceRoleAccess.tablesPassed}
- **Tables Failed**: ${results.serviceRoleAccess.tablesFailed}

### **Anonymous User Access:**
- **Tables Tested**: ${results.anonUserAccess.tablesTested}
- **Tables Passed**: ${results.anonUserAccess.tablesPassed}
- **Tables Failed**: ${results.anonUserAccess.tablesFailed}

### **Anonymous User Write Protection:**
- **Tables Tested**: ${results.anonUserWriteAccess.tablesTested}
- **Tables Blocked**: ${results.anonUserWriteAccess.tablesBlocked}
- **Tables Allowed**: ${results.anonUserWriteAccess.tablesAllowed}

### **Data Ingress:**
- **Operations Tested**: ${results.dataIngress.operationsTested}
- **Operations Passed**: ${results.dataIngress.operationsPassed}
- **Operations Failed**: ${results.dataIngress.operationsFailed}

### **Data Egress:**
- **Operations Tested**: ${results.dataEgress.operationsTested}
- **Operations Passed**: ${results.dataEgress.operationsPassed}
- **Operations Failed**: ${results.dataEgress.operationsFailed}

---

## 🔒 **SECURITY STATUS**

### **Service Role Access:**
${results.serviceRoleAccess.tablesPassed > 0 ? '✅ Service role can access backend tables' : '❌ Service role access issues'}

### **Public Read Access:**
${results.anonUserAccess.tablesPassed > 0 ? '✅ Anonymous users can read public data' : '❌ Public read access issues'}

### **Write Protection:**
${results.anonUserWriteAccess.tablesBlocked > 0 ? '✅ Anonymous users are blocked from writing' : '❌ Write protection issues'}

### **Data Ingress:**
${results.dataIngress.operationsPassed > 0 ? '✅ Data can be inserted with service role' : '❌ Data ingress issues'}

### **Data Egress:**
${results.dataEgress.operationsPassed > 0 ? '✅ Data can be read by anonymous users' : '❌ Data egress issues'}

---

## 🚨 **ISSUES FOUND**

${Object.values(results).flatMap(r => r.errors || []).length > 0 ? 
  Object.values(results).flatMap(r => r.errors || []).map(error => `- ${error}`).join('\n') : 
  'No issues found'}

---

## 🎯 **NEXT STEPS**

### **Immediate Actions:**
1. **Verify Service Role** - Ensure backend can access all necessary tables
2. **Test User Authentication** - Verify authenticated users can access their data
3. **Monitor Performance** - Check for any performance impact from RLS
4. **Update Application** - Ensure application code works with RLS policies

### **Security Validation:**
1. **User Data Protection** - Ensure user data is properly protected
2. **Admin Access** - Verify admin functions still work
3. **API Security** - Test API endpoints with RLS enabled
4. **Authentication** - Verify authentication flows work correctly

---

*This comprehensive RLS verification report was generated on ${new Date().toISOString()}.*`;

  const outputPath = path.join(__dirname, '..', 'scratch', 'planning-2025', 'RLS_COMPREHENSIVE_VERIFICATION_REPORT.md');
  
  try {
    fs.writeFileSync(outputPath, report);
    console.log(`✅ Comprehensive RLS verification report generated: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error writing report:', error);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive RLS verification...');
  
  const results = await runComprehensiveVerification();
  
  console.log('\n📊 Comprehensive RLS Verification Results:');
  console.log(`Service Role Access: ${results.serviceRoleAccess.tablesPassed}/${results.serviceRoleAccess.tablesTested} passed`);
  console.log(`Anonymous User Access: ${results.anonUserAccess.tablesPassed}/${results.anonUserAccess.tablesTested} passed`);
  console.log(`Anonymous Write Protection: ${results.anonUserWriteAccess.tablesBlocked}/${results.anonUserWriteAccess.tablesTested} blocked`);
  console.log(`Data Ingress: ${results.dataIngress.operationsPassed}/${results.dataIngress.operationsTested} passed`);
  console.log(`Data Egress: ${results.dataEgress.operationsPassed}/${results.dataEgress.operationsTested} passed`);
  
  const totalErrors = Object.values(results).flatMap(r => r.errors || []).length;
  if (totalErrors > 0) {
    console.log(`\n❌ Total Errors: ${totalErrors}`);
  }
  
  await generateComprehensiveReport(results);
  
  if (totalErrors === 0) {
    console.log('\n🎉 Comprehensive RLS verification completed successfully!');
  } else {
    console.log('\n⚠️ Comprehensive RLS verification completed with some issues. Check the report for details.');
  }
}

main().catch(console.error);
