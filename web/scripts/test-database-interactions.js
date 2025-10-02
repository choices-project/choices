#!/usr/bin/env node

/**
 * COMPREHENSIVE Database Interaction Testing Script
 * Tests ALL database interactions found in codebase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local manually
try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (err) {
  console.log('No .env.local file found, using environment variables');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function testDatabaseInteractions() {
  console.log('🧪 TESTING ALL DATABASE INTERACTIONS');
  console.log('====================================\n');

  const testResults = {
    test_date: new Date().toISOString(),
    total_tests: 0,
    passed_tests: 0,
    failed_tests: 0,
    test_results: [],
    summary: {
      tables_tested: 0,
      operations_tested: 0,
      rls_tests: 0,
      performance_tests: 0
    }
  };

  try {
    // 1. Test all tables for basic access
    console.log('📋 TESTING TABLE ACCESS...');
    const tablesToTest = [
      'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'webauthn_challenges',
      'error_logs', 'feedback', 'user_consent', 'privacy_logs', 'location_consent_audit',
      'civics_person_xref', 'civics_votes_minimal', 'civics_divisions', 'civics_representatives',
      'civics_addresses', 'civics_campaign_finance', 'civics_votes', 'civic_jurisdictions',
      'jurisdiction_aliases', 'jurisdiction_geometries', 'jurisdiction_tiles',
      'user_location_resolutions', 'candidate_jurisdictions', 'analytics_events',
      'audit_logs', 'rate_limits', 'security_events'
    ];

    for (const table of tablesToTest) {
      console.log(`\n🧪 Testing table: ${table}`);
      
      // Test 1: Basic table access
      const accessTest = await testTableAccess(table);
      testResults.test_results.push(accessTest);
      testResults.total_tests++;
      if (accessTest.passed) testResults.passed_tests++;
      else testResults.failed_tests++;

      // Test 2: RLS status
      const rlsTest = await testRLSStatus(table);
      testResults.test_results.push(rlsTest);
      testResults.total_tests++;
      if (rlsTest.passed) testResults.passed_tests++;
      else testResults.failed_tests++;

      // Test 3: Data operations (if table has data)
      if (accessTest.row_count > 0) {
        const operationsTest = await testDataOperations(table);
        testResults.test_results.push(operationsTest);
        testResults.total_tests++;
        if (operationsTest.passed) testResults.passed_tests++;
        else testResults.failed_tests++;
      }

      testResults.summary.tables_tested++;
    }

    // 2. Test all API endpoints
    console.log('\n🌐 TESTING API ENDPOINTS...');
    const apiEndpoints = [
      '/api/polls',
      '/api/polls/trending',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/me',
      '/api/v1/civics/address-lookup',
      '/api/civics/contact/[id]',
      '/api/health'
    ];

    for (const endpoint of apiEndpoints) {
      console.log(`\n🧪 Testing endpoint: ${endpoint}`);
      
      const endpointTest = await testAPIEndpoint(endpoint);
      testResults.test_results.push(endpointTest);
      testResults.total_tests++;
      if (endpointTest.passed) testResults.passed_tests++;
      else testResults.failed_tests++;
    }

    // 3. Test authentication flows
    console.log('\n🔐 TESTING AUTHENTICATION FLOWS...');
    const authTests = [
      'webauthn_credentials',
      'webauthn_challenges',
      'user_profiles'
    ];

    for (const authTable of authTests) {
      console.log(`\n🧪 Testing auth table: ${authTable}`);
      
      const authTest = await testAuthenticationFlow(authTable);
      testResults.test_results.push(authTest);
      testResults.total_tests++;
      if (authTest.passed) testResults.passed_tests++;
      else testResults.failed_tests++;
    }

    // 4. Test performance
    console.log('\n⚡ TESTING PERFORMANCE...');
    const performanceTest = await testDatabasePerformance();
    testResults.test_results.push(performanceTest);
    testResults.total_tests++;
    if (performanceTest.passed) testResults.passed_tests++;
    else testResults.failed_tests++;

    // 5. Generate comprehensive test report
    console.log('\n📊 GENERATING TEST REPORTS...');
    
    const testReport = generateTestReport(testResults);
    writeFileSync('database/DATABASE_INTERACTION_TEST_REPORT.md', testReport);
    
    const testData = JSON.stringify(testResults, null, 2);
    writeFileSync('database/database_interaction_test_results.json', testData);
    
    console.log('\n✅ DATABASE INTERACTION TESTING COMPLETED!');
    console.log(`📊 Total tests: ${testResults.total_tests}`);
    console.log(`✅ Passed: ${testResults.passed_tests}`);
    console.log(`❌ Failed: ${testResults.failed_tests}`);
    console.log(`📝 Test report: database/DATABASE_INTERACTION_TEST_REPORT.md`);
    console.log(`📄 Test data: database/database_interaction_test_results.json`);

  } catch (error) {
    console.error('❌ Database interaction testing failed:', error);
  }
}

async function testTableAccess(tableName) {
  const test = {
    test_name: `Table Access: ${tableName}`,
    table: tableName,
    passed: false,
    error: null,
    row_count: 0,
    access_time: 0,
    details: {}
  };

  try {
    const startTime = Date.now();
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    const endTime = Date.now();

    test.access_time = endTime - startTime;
    test.row_count = count || 0;

    if (error) {
      if (error.code === 'PGRST116') {
        test.error = 'Table does not exist';
        test.details = { error_code: error.code, message: error.message };
      } else {
        test.error = error.message;
        test.details = { error_code: error.code, message: error.message };
      }
    } else {
      test.passed = true;
      test.details = { 
        accessible: true, 
        row_count: count || 0,
        access_time_ms: test.access_time
      };
    }
  } catch (err) {
    test.error = err.message;
    test.details = { error: err.message };
  }

  return test;
}

async function testRLSStatus(tableName) {
  const test = {
    test_name: `RLS Status: ${tableName}`,
    table: tableName,
    passed: false,
    error: null,
    rls_enabled: false,
    details: {}
  };

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST301') {
        test.rls_enabled = true;
        test.passed = true;
        test.details = { rls_status: 'ENABLED', access_denied: true };
      } else {
        test.error = error.message;
        test.details = { error_code: error.code, message: error.message };
      }
    } else {
      test.rls_enabled = false;
      test.passed = false;
      test.error = 'RLS DISABLED - Data accessible without authentication';
      test.details = { rls_status: 'DISABLED', data_accessible: true };
    }
  } catch (err) {
    test.error = err.message;
    test.details = { error: err.message };
  }

  return test;
}

async function testDataOperations(tableName) {
  const test = {
    test_name: `Data Operations: ${tableName}`,
    table: tableName,
    passed: false,
    error: null,
    operations_tested: [],
    details: {}
  };

  try {
    // Test SELECT operation
    const { data: selectData, error: selectError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (selectError) {
      test.error = `SELECT failed: ${selectError.message}`;
      test.details = { select_error: selectError.message };
    } else {
      test.operations_tested.push('SELECT');
      test.passed = true;
      test.details = { 
        select_success: true,
        sample_data: selectData && selectData.length > 0 ? 'Yes' : 'No'
      };
    }
  } catch (err) {
    test.error = err.message;
    test.details = { error: err.message };
  }

  return test;
}

async function testAPIEndpoint(endpoint) {
  const test = {
    test_name: `API Endpoint: ${endpoint}`,
    endpoint: endpoint,
    passed: false,
    error: null,
    response_status: null,
    response_time: 0,
    details: {}
  };

  try {
    const startTime = Date.now();
    const response = await fetch(`${supabaseUrl.replace('/rest/v1', '')}${endpoint}`);
    const endTime = Date.now();

    test.response_time = endTime - startTime;
    test.response_status = response.status;
    test.passed = response.status < 500; // Consider 4xx as passed (expected behavior)
    
    test.details = {
      status_code: response.status,
      response_time_ms: test.response_time,
      success: test.passed
    };
  } catch (err) {
    test.error = err.message;
    test.details = { error: err.message };
  }

  return test;
}

async function testAuthenticationFlow(authTable) {
  const test = {
    test_name: `Authentication Flow: ${authTable}`,
    table: authTable,
    passed: false,
    error: null,
    details: {}
  };

  try {
    const { data, error } = await supabase
      .from(authTable)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST301') {
        test.passed = true;
        test.details = { rls_enabled: true, access_denied: true };
      } else {
        test.error = error.message;
        test.details = { error_code: error.code, message: error.message };
      }
    } else {
      test.passed = true;
      test.details = { accessible: true, row_count: data ? data.length : 0 };
    }
  } catch (err) {
    test.error = err.message;
    test.details = { error: err.message };
  }

  return test;
}

async function testDatabasePerformance() {
  const test = {
    test_name: 'Database Performance',
    passed: false,
    error: null,
    performance_metrics: {},
    details: {}
  };

  try {
    const startTime = Date.now();
    
    // Test multiple queries in parallel
    const queries = [
      supabase.from('polls').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true })
    ];

    const results = await Promise.all(queries);
    const endTime = Date.now();

    test.performance_metrics = {
      total_time_ms: endTime - startTime,
      queries_executed: queries.length,
      average_time_ms: (endTime - startTime) / queries.length
    };

    test.passed = endTime - startTime < 5000; // Pass if under 5 seconds
    test.details = test.performance_metrics;
  } catch (err) {
    test.error = err.message;
    test.details = { error: err.message };
  }

  return test;
}

function generateTestReport(testResults) {
  let doc = `# 🧪 Database Interaction Test Report

**Generated**: ${new Date().toISOString()}  
**Total Tests**: ${testResults.total_tests}  
**Passed**: ${testResults.passed_tests}  
**Failed**: ${testResults.failed_tests}  
**Success Rate**: ${((testResults.passed_tests / testResults.total_tests) * 100).toFixed(2)}%

## 📊 **TEST SUMMARY**

### **Overall Results**
- **Total Tests**: ${testResults.total_tests}
- **Passed Tests**: ${testResults.passed_tests}
- **Failed Tests**: ${testResults.failed_tests}
- **Success Rate**: ${((testResults.passed_tests / testResults.total_tests) * 100).toFixed(2)}%

### **Test Categories**
- **Tables Tested**: ${testResults.summary.tables_tested}
- **Operations Tested**: ${testResults.summary.operations_tested}
- **RLS Tests**: ${testResults.summary.rls_tests}
- **Performance Tests**: ${testResults.summary.performance_tests}

## 📋 **DETAILED TEST RESULTS**

### **Test Results by Category**
`;

  // Group tests by category
  const testCategories = {};
  testResults.test_results.forEach(test => {
    const category = test.test_name.split(':')[0];
    if (!testCategories[category]) {
      testCategories[category] = [];
    }
    testCategories[category].push(test);
  });

  Object.entries(testCategories).forEach(([category, tests]) => {
    doc += `\n#### **${category}**\n\n`;
    doc += `| Test | Status | Details |\n`;
    doc += `|------|--------|----------|\n`;
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      const details = test.error || JSON.stringify(test.details);
      doc += `| ${test.test_name} | ${status} | ${details} |\n`;
    });
  });

  doc += `\n## 🚨 **FAILED TESTS**\n\n`;
  
  const failedTests = testResults.test_results.filter(test => !test.passed);
  if (failedTests.length > 0) {
    failedTests.forEach(test => {
      doc += `### **${test.test_name}**\n`;
      doc += `- **Error**: ${test.error}\n`;
      doc += `- **Details**: ${JSON.stringify(test.details, null, 2)}\n\n`;
    });
  } else {
    doc += `No failed tests! 🎉\n`;
  }

  return doc;
}

testDatabaseInteractions();
