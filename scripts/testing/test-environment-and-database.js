#!/usr/bin/env node

/**
 * Comprehensive Environment and Database Test
 * 
 * This script tests:
 * 1. Environment variable loading with dotenv
 * 2. Supabase configuration
 * 3. Database connectivity
 * 4. Admin access verification
 * 5. Core system functionality
 */

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function runTests() {
  console.log('🧪 Environment and Database Test Suite');
  console.log('=====================================\n');

  let testResults = {
    envLoading: false,
    supabaseConfig: false,
    databaseConnection: false,
    adminAccess: false,
    tableAccess: false,
    overall: false
  };

// Test 1: Environment Variable Loading
console.log('1️⃣ Testing Environment Variable Loading...');
try {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
    console.log('📝 Please update web/.env.local with your Supabase credentials');
  } else {
    console.log('✅ All required environment variables found');
    
    // Check if they're still placeholder values
    const hasPlaceholders = requiredVars.some(varName => 
      process.env[varName]?.includes('your_') || 
      process.env[varName]?.includes('here')
    );
    
    if (hasPlaceholders) {
      console.log('⚠️  Environment variables contain placeholder values');
      console.log('📝 Please replace with actual Supabase credentials');
    } else {
      console.log('✅ Environment variables contain real values');
      testResults.envLoading = true;
    }
  }
} catch (error) {
  console.log(`❌ Environment loading error: ${error.message}`);
}

console.log('');

// Test 2: Supabase Configuration
console.log('2️⃣ Testing Supabase Configuration...');
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase URL or key');
  } else if (supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
    console.log('❌ Supabase credentials are placeholder values');
  } else {
    console.log('✅ Supabase configuration appears valid');
    testResults.supabaseConfig = true;
  }
} catch (error) {
  console.log(`❌ Supabase config error: ${error.message}`);
}

console.log('');

// Test 3: Database Connection
console.log('3️⃣ Testing Database Connection...');
try {
  if (!testResults.supabaseConfig) {
    console.log('⏭️  Skipping database test - Supabase config invalid');
  } else {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test basic connection
    const { data, error } = await supabase.from('ia_users').select('count').limit(1);
    
    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`);
      if (error.message.includes('relation "ia_users" does not exist')) {
        console.log('⚠️  ia_users table may not exist - checking other tables...');
        
        // Try to list tables
        const { data: tables, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        
        if (tableError) {
          console.log(`❌ Cannot access table information: ${tableError.message}`);
        } else {
          console.log('✅ Database connection successful');
          console.log(`📊 Available tables: ${tables?.map(t => t.table_name).join(', ') || 'None'}`);
          testResults.databaseConnection = true;
        }
      }
    } else {
      console.log('✅ Database connection successful');
      testResults.databaseConnection = true;
    }
  }
} catch (error) {
  console.log(`❌ Database connection error: ${error.message}`);
}

console.log('');

// Test 4: Admin Access Verification
console.log('4️⃣ Testing Admin Access...');
try {
  if (!testResults.databaseConnection) {
    console.log('⏭️  Skipping admin test - Database connection failed');
  } else {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test service role access
    const { data: adminData, error: adminError } = await supabase
      .from('ia_users')
      .select('*')
      .limit(1);

    if (adminError) {
      console.log(`❌ Admin access failed: ${adminError.message}`);
    } else {
      console.log('✅ Admin access successful');
      console.log(`📊 Found ${adminData?.length || 0} users in ia_users table`);
      testResults.adminAccess = true;
    }
  }
} catch (error) {
  console.log(`❌ Admin access error: ${error.message}`);
}

console.log('');

// Test 5: Core Table Access
console.log('5️⃣ Testing Core Table Access...');
try {
  if (!testResults.adminAccess) {
    console.log('⏭️  Skipping table access test - Admin access failed');
  } else {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const coreTables = ['ia_users', 'po_polls', 'po_votes', 'ia_tokens', 'trending_topics'];
    const accessibleTables = [];

    for (const tableName of coreTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`⚠️  Table ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName}: Accessible`);
          accessibleTables.push(tableName);
        }
      } catch (tableError) {
        console.log(`❌ Table ${tableName}: ${tableError.message}`);
      }
    }

    if (accessibleTables.length > 0) {
      console.log(`📊 Accessible tables: ${accessibleTables.join(', ')}`);
      testResults.tableAccess = true;
    }
  }
} catch (error) {
  console.log(`❌ Table access error: ${error.message}`);
}

console.log('');

// Summary
console.log('📊 Test Results Summary');
console.log('=======================');
console.log(`Environment Loading: ${testResults.envLoading ? '✅' : '❌'}`);
console.log(`Supabase Config: ${testResults.supabaseConfig ? '✅' : '❌'}`);
console.log(`Database Connection: ${testResults.databaseConnection ? '✅' : '❌'}`);
console.log(`Admin Access: ${testResults.adminAccess ? '✅' : '❌'}`);
console.log(`Table Access: ${testResults.tableAccess ? '✅' : '❌'}`);

const passedTests = Object.values(testResults).filter(Boolean).length;
const totalTests = Object.keys(testResults).length;

console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! System is ready.');
  testResults.overall = true;
} else {
  console.log('⚠️  Some tests failed. Please check the issues above.');
}

console.log('\n📝 Next Steps:');
if (!testResults.envLoading) {
  console.log('1. Update web/.env.local with real Supabase credentials');
}
if (!testResults.databaseConnection) {
  console.log('2. Verify Supabase project is active and accessible');
}
if (!testResults.adminAccess) {
  console.log('3. Check service role key permissions');
}

  // Export results for other scripts
  return testResults;
}

// Run the tests
runTests().then(testResults => {
  console.log('\n📊 Final Test Results:');
  console.log('======================');
  console.log(`Environment Loading: ${testResults.envLoading ? '✅' : '❌'}`);
  console.log(`Supabase Config: ${testResults.supabaseConfig ? '✅' : '❌'}`);
  console.log(`Database Connection: ${testResults.databaseConnection ? '✅' : '❌'}`);
  console.log(`Admin Access: ${testResults.adminAccess ? '✅' : '❌'}`);
  console.log(`Table Access: ${testResults.tableAccess ? '✅' : '❌'}`);
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length - 1; // Exclude 'overall'
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! System is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

// Export for other scripts
module.exports = { runTests };
