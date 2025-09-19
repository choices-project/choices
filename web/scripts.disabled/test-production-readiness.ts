// web/scripts/test-production-readiness.ts
// Test production readiness without requiring new schema
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

type TestResult = {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('🧪 Running production readiness tests...\n');
  
  // Test 1: Database Connection
  try {
    const { error } = await supabase
      .from('civics_representatives')
      .select('id')
      .limit(1);
    
    if (error) {
      results.push({
        test: 'Database Connection',
        status: 'FAIL',
        message: 'Failed to connect to database',
        details: error
      });
    } else {
      const { count } = await supabase
        .from('civics_representatives')
        .select('*', { count: 'exact', head: true });
      results.push({
        test: 'Database Connection',
        status: 'PASS',
        message: `Connected. Total reps: ${count}`
      });
    }
  } catch (error) {
    results.push({
      test: 'Database Connection',
      status: 'FAIL',
      message: 'Database connection failed',
      details: error
    });
  }
  
  // Test 2: Data Coverage
  try {
    const { data: counts, error } = await supabase
      .from('civics_representatives')
      .select('level, jurisdiction');
    
    if (error) {
      results.push({
        test: 'Data Coverage',
        status: 'FAIL',
        message: 'Failed to fetch representative counts',
        details: error
      });
    } else {
      const levelCounts = counts.reduce((acc: any, rep: any) => {
        acc[rep.level] = (acc[rep.level] || 0) + 1;
        return acc;
      }, {}) || {};
      
      const totalReps = counts.length || 0;
      
      results.push({
        test: 'Data Coverage',
        status: totalReps > 1000 ? 'PASS' : 'WARN',
        message: `Found ${totalReps} representatives: ${JSON.stringify(levelCounts)}`,
        details: { total: totalReps, byLevel: levelCounts }
      });
    }
  } catch (error) {
    results.push({
      test: 'Data Coverage',
      status: 'FAIL',
      message: 'Data coverage test failed',
      details: error
    });
  }
  
  // Test 3: Contact Information Availability
  try {
    const { data, error } = await supabase
      .from('civics_contact_info')
      .select('count(*)');
    
    if (error) {
      results.push({
        test: 'Contact Information',
        status: 'WARN',
        message: 'Contact info table not available (expected for new schema)',
        details: error
      });
    } else {
      const contactCount = (data as any)?.[0]?.count || 0;
      results.push({
        test: 'Contact Information',
        status: 'PASS',
        message: `Contact information table available with ${contactCount} records`
      });
    }
  } catch (error) {
    results.push({
      test: 'Contact Information',
      status: 'WARN',
      message: 'Contact info table not available (expected for new schema)',
      details: error
    });
  }
  
  // Test 4: API Endpoint Functionality
  try {
    const { data: federalReps, error } = await supabase
      .from('civics_representatives')
      .select('*')
      .eq('level', 'federal')
      .limit(5);
    
    if (error) {
      results.push({
        test: 'API Data Access',
        status: 'FAIL',
        message: 'Failed to fetch federal representatives',
        details: error
      });
    } else {
      results.push({
        test: 'API Data Access',
        status: 'PASS',
        message: `Successfully fetched ${federalReps.length || 0} federal representatives`,
        details: { sample: federalReps[0] }
      });
    }
  } catch (error) {
    results.push({
      test: 'API Data Access',
      status: 'FAIL',
      message: 'API data access test failed',
      details: error
    });
  }
  
  // Test 5: Data Quality
  try {
    const { data: reps, error } = await supabase
      .from('civics_representatives')
      .select('name, office, level, jurisdiction, source')
      .limit(10);
    
    if (error) {
      results.push({
        test: 'Data Quality',
        status: 'FAIL',
        message: 'Failed to fetch representative data for quality check',
        details: error
      });
    } else {
      const hasRequiredFields = reps.every(rep => 
        rep.name && rep.office && rep.level && rep.jurisdiction
      ) || false;
      
      const hasDataSource = reps.every(rep => rep.source) || false;
      
      results.push({
        test: 'Data Quality',
        status: hasRequiredFields && hasDataSource ? 'PASS' : 'WARN',
        message: `Data quality check: Required fields: ${hasRequiredFields}, Data sources: ${hasDataSource}`,
        details: { hasRequiredFields, hasDataSource, sample: reps[0] }
      });
    }
  } catch (error) {
    results.push({
      test: 'Data Quality',
      status: 'FAIL',
      message: 'Data quality test failed',
      details: error
    });
  }
  
  // Test 6: Local Data Coverage
  try {
    const { data: localReps, error } = await supabase
      .from('civics_representatives')
      .select('*')
      .eq('level', 'local');
    
    if (error) {
      results.push({
        test: 'Local Data Coverage',
        status: 'WARN',
        message: 'Failed to fetch local representatives',
        details: error
      });
    } else {
      const localCount = localReps.length || 0;
      results.push({
        test: 'Local Data Coverage',
        status: localCount > 0 ? 'PASS' : 'WARN',
        message: `Found ${localCount} local representatives`,
        details: { count: localCount, sample: localReps[0] }
      });
    }
  } catch (error) {
    results.push({
      test: 'Local Data Coverage',
      status: 'WARN',
      message: 'Local data coverage test failed',
      details: error
    });
  }
  
  return results;
}

async function runProductionReadinessTests() {
  try {
    const results = await runTests();
    
    console.log('\n📊 Production Readiness Test Results:');
    console.log('='.repeat(60));
    
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;
    
    results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (result.details && typeof result.details === 'object') {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      if (result.status === 'PASS') passCount++;
      else if (result.status === 'WARN') warnCount++;
      else failCount++;
    });
    
    console.log('\n📈 Summary:');
    console.log(`✅ PASS: ${passCount} tests`);
    console.log(`⚠️ WARN: ${warnCount} tests`);
    console.log(`❌ FAIL: ${failCount} tests`);
    
    const overallStatus = failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS';
    const overallIcon = overallStatus === 'PASS' ? '✅' : overallStatus === 'WARN' ? '⚠️' : '❌';
    
    console.log(`\n${overallIcon} Overall Status: ${overallStatus}`);
    
    if (overallStatus === 'PASS') {
      console.log('\n🎉 System is ready for production deployment!');
    } else if (overallStatus === 'WARN') {
      console.log('\n⚠️ System is mostly ready but has some warnings to address.');
    } else {
      console.log('\n❌ System needs fixes before production deployment.');
    }
    
    // Recommendations
    console.log('\n📋 Recommendations:');
    if (failCount > 0) {
      console.log('🔧 Fix failing tests before proceeding');
    }
    if (warnCount > 0) {
      console.log('⚠️ Address warnings for optimal production readiness');
    }
    if (passCount === results.length) {
      console.log('🚀 All tests passed! Ready for production guardrails migration.');
    }
    
  } catch (error) {
    console.error('❌ Production readiness tests failed:', error);
    process.exit(1);
  }
}

// Run the tests
runProductionReadinessTests();
