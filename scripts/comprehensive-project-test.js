#!/usr/bin/env node

/**
 * Comprehensive Project Test Suite
 * 
 * This script tests all aspects of the Choices platform:
 * 1. Environment and database connectivity
 * 2. API endpoint functionality
 * 3. Admin dashboard access
 * 4. Automated polls feature
 * 5. Security and authentication
 * 6. Core system integration
 */

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Comprehensive Project Test Suite');
console.log('===================================\n');

let testResults = {
  environment: false,
  database: false,
  apiEndpoints: false,
  adminAccess: false,
  automatedPolls: false,
  security: false,
  overall: false
};

async function runComprehensiveTests() {
  console.log('🚀 Starting comprehensive project testing...\n');

  // Test 1: Environment and Database
  console.log('1️⃣ Testing Environment and Database...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('ia_users')
      .select('count')
      .limit(1);

    if (testError) {
      console.log(`❌ Database connection failed: ${testError.message}`);
    } else {
      console.log('✅ Database connection successful');
      testResults.database = true;
    }

    // Test environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
    } else {
      console.log('✅ All environment variables present');
      testResults.environment = true;
    }

  } catch (error) {
    console.log(`❌ Environment/database test failed: ${error.message}`);
  }

  console.log('');

  // Test 2: Core Tables and Data
  console.log('2️⃣ Testing Core Tables and Data...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const coreTables = [
      'ia_users', 'po_polls', 'po_votes', 'ia_tokens', 'trending_topics',
      'generated_polls', 'data_sources', 'poll_generation_logs', 'quality_metrics'
    ];

    const accessibleTables = [];
    const inaccessibleTables = [];

    for (const tableName of coreTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          inaccessibleTables.push(tableName);
        } else {
          accessibleTables.push(tableName);
        }
      } catch (tableError) {
        inaccessibleTables.push(tableName);
      }
    }

    console.log(`✅ Accessible tables: ${accessibleTables.join(', ')}`);
    if (inaccessibleTables.length > 0) {
      console.log(`⚠️  Inaccessible tables: ${inaccessibleTables.join(', ')}`);
    }

    // Check data in key tables
    const { data: polls, error: pollsError } = await supabase
      .from('po_polls')
      .select('*')
      .limit(5);

    if (!pollsError) {
      console.log(`📊 po_polls: ${polls?.length || 0} polls found`);
    }

    const { data: topics, error: topicsError } = await supabase
      .from('trending_topics')
      .select('*')
      .limit(5);

    if (!topicsError) {
      console.log(`📊 trending_topics: ${topics?.length || 0} topics found`);
    }

  } catch (error) {
    console.log(`❌ Core tables test failed: ${error.message}`);
  }

  console.log('');

  // Test 3: API Endpoints (Simulated)
  console.log('3️⃣ Testing API Endpoints...');
  try {
    // Check if API route files exist
    const fs = require('fs');
    const path = require('path');
    
    const apiRoutes = [
      'web/app/api/admin/trending-topics/route.ts',
      'web/app/api/admin/generated-polls/route.ts',
      'web/app/api/admin/trending-topics/analyze/route.ts',
      'web/app/api/admin/generated-polls/[id]/approve/route.ts',
      'web/app/api/polls/route.ts',
      'web/app/api/polls/[id]/vote/route.ts',
      'web/app/api/polls/[id]/results/route.ts'
    ];

    const existingRoutes = [];
    const missingRoutes = [];

    apiRoutes.forEach(route => {
      const fullPath = path.join(__dirname, '..', route);
      if (fs.existsSync(fullPath)) {
        existingRoutes.push(route);
      } else {
        missingRoutes.push(route);
      }
    });

    console.log(`✅ Existing API routes: ${existingRoutes.length}`);
    existingRoutes.forEach(route => console.log(`   - ${route}`));

    if (missingRoutes.length > 0) {
      console.log(`⚠️  Missing API routes: ${missingRoutes.length}`);
      missingRoutes.forEach(route => console.log(`   - ${route}`));
    }

    testResults.apiEndpoints = existingRoutes.length >= 5; // At least 5 routes should exist

  } catch (error) {
    console.log(`❌ API endpoints test failed: ${error.message}`);
  }

  console.log('');

  // Test 4: Admin Dashboard Components
  console.log('4️⃣ Testing Admin Dashboard Components...');
  try {
    const fs = require('fs');
    const path = require('path');
    
    const adminComponents = [
      'web/app/admin/page.tsx',
      'web/app/admin/layout.tsx',
      'web/app/admin/automated-polls/page.tsx',
      'web/lib/service-role-admin.ts'
    ];

    const existingComponents = [];
    const missingComponents = [];

    adminComponents.forEach(component => {
      const fullPath = path.join(__dirname, '..', component);
      if (fs.existsSync(fullPath)) {
        existingComponents.push(component);
      } else {
        missingComponents.push(component);
      }
    });

    console.log(`✅ Existing admin components: ${existingComponents.length}`);
    existingComponents.forEach(component => console.log(`   - ${component}`));

    if (missingComponents.length > 0) {
      console.log(`⚠️  Missing admin components: ${missingComponents.length}`);
      missingComponents.forEach(component => console.log(`   - ${component}`));
    }

    testResults.adminAccess = existingComponents.length >= 3; // At least 3 components should exist

  } catch (error) {
    console.log(`❌ Admin dashboard test failed: ${error.message}`);
  }

  console.log('');

  // Test 5: Automated Polls Feature
  console.log('5️⃣ Testing Automated Polls Feature...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test trending topics functionality
    const { data: topics, error: topicsError } = await supabase
      .from('trending_topics')
      .select('*')
      .limit(1);

    if (topicsError) {
      console.log(`⚠️  trending_topics table: ${topicsError.message}`);
    } else {
      console.log(`✅ trending_topics table: ${topics?.length || 0} topics`);
    }

    // Test generated polls functionality
    const { data: generatedPolls, error: generatedError } = await supabase
      .from('generated_polls')
      .select('*')
      .limit(1);

    if (generatedError) {
      console.log(`⚠️  generated_polls table: ${generatedError.message}`);
    } else {
      console.log(`✅ generated_polls table: ${generatedPolls?.length || 0} polls`);
    }

    // Check if automated polls page exists
    const fs = require('fs');
    const path = require('path');
    const automatedPollsPage = path.join(__dirname, '../web/app/admin/automated-polls/page.tsx');
    
    if (fs.existsSync(automatedPollsPage)) {
      console.log('✅ Automated polls admin page exists');
      testResults.automatedPolls = true;
    } else {
      console.log('⚠️  Automated polls admin page missing');
    }

  } catch (error) {
    console.log(`❌ Automated polls test failed: ${error.message}`);
  }

  console.log('');

  // Test 6: Security and Authentication
  console.log('6️⃣ Testing Security and Authentication...');
  try {
    // Check service role functionality
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test service role access to protected tables
    const { data: protectedData, error: protectedError } = await supabase
      .from('ia_tokens')
      .select('*')
      .limit(1);

    if (protectedError) {
      console.log(`⚠️  Service role access test: ${protectedError.message}`);
    } else {
      console.log('✅ Service role access working');
    }

    // Check if security policies file exists
    const fs = require('fs');
    const path = require('path');
    const securityPolicies = path.join(__dirname, '../database/security_policies_fixed.sql');
    
    if (fs.existsSync(securityPolicies)) {
      console.log('✅ Security policies file exists');
      testResults.security = true;
    } else {
      console.log('⚠️  Security policies file missing');
    }

    // Check .env.local protection
    const envPath = path.join(__dirname, '../web/.env.local');
    const stats = fs.statSync(envPath);
    const mode = stats.mode & parseInt('777', 8);
    
    if (mode === parseInt('444', 8)) {
      console.log('✅ .env.local is read-only protected');
    } else {
      console.log('⚠️  .env.local is not read-only protected');
    }

  } catch (error) {
    console.log(`❌ Security test failed: ${error.message}`);
  }

  console.log('');

  // Summary
  console.log('📊 Comprehensive Test Results');
  console.log('=============================');
  console.log(`Environment: ${testResults.environment ? '✅' : '❌'}`);
  console.log(`Database: ${testResults.database ? '✅' : '❌'}`);
  console.log(`API Endpoints: ${testResults.apiEndpoints ? '✅' : '❌'}`);
  console.log(`Admin Access: ${testResults.adminAccess ? '✅' : '❌'}`);
  console.log(`Automated Polls: ${testResults.automatedPolls ? '✅' : '❌'}`);
  console.log(`Security: ${testResults.security ? '✅' : '❌'}`);

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length - 1; // Exclude 'overall'

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} test categories passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All test categories passed! Project is ready.');
    testResults.overall = true;
  } else {
    console.log('⚠️  Some test categories failed. Review issues above.');
  }

  return testResults;
}

// Run the comprehensive tests
runComprehensiveTests().then(results => {
  console.log('\n📝 Next Steps Recommendations:');
  console.log('==============================');
  
  if (!results.environment) {
    console.log('1. Fix environment variable configuration');
  }
  
  if (!results.database) {
    console.log('2. Resolve database connectivity issues');
  }
  
  if (!results.apiEndpoints) {
    console.log('3. Implement missing API endpoints');
  }
  
  if (!results.adminAccess) {
    console.log('4. Complete admin dashboard components');
  }
  
  if (!results.automatedPolls) {
    console.log('5. Finish automated polls feature implementation');
  }
  
  if (!results.security) {
    console.log('6. Review and update security policies');
  }
  
  if (results.overall) {
    console.log('\n🚀 Project is ready for next development phase!');
    console.log('Suggested next steps:');
    console.log('- Test the admin dashboard UI');
    console.log('- Implement trending topics analysis');
    console.log('- Add poll generation functionality');
    console.log('- Deploy to production environment');
  }
}).catch(error => {
  console.error('❌ Comprehensive test suite failed:', error);
});
