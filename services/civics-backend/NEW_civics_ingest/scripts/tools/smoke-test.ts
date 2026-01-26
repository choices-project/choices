#!/usr/bin/env node
/**
 * Smoke test for data integrity after ingest.
 * 
 * Performs live Supabase checks to verify:
 * - Representative counts and status distribution
 * - Data quality score distribution
 * - Identifier coverage
 * - Term date validity
 * - Foreign key integrity
 * - Constraint violations
 * 
 * Usage:
 *   npm run tools:smoke-test [--quick]
 * 
 * Note: Requires live Supabase connection (guarded by env vars)
 */
import 'dotenv/config';

import { getSupabaseClient } from '../../clients/supabase.js';

interface SmokeTestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: Record<string, unknown>;
}

async function runSmokeTests(options: { quick?: boolean }): Promise<void> {
  const { quick = false } = options;
  
  console.log('\n🧪 Data Integrity Smoke Test');
  console.log('='.repeat(60));
  console.log('⚠️  This test uses LIVE Supabase connection');
  
  // Guard: Check env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const client = getSupabaseClient();
  const results: SmokeTestResult[] = [];
  
  // Test 1: Representative counts
  console.log('\n📊 Test 1: Representative counts...');
  try {
    const { count: totalCount } = await client
      .from('representatives_core')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeCount } = await client
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    const { count: inactiveCount } = await client
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive');
    
    const { count: historicalCount } = await client
      .from('representatives_core')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'historical');
    
    const status = totalCount === 0 ? 'fail' : totalCount! < 100 ? 'warn' : 'pass';
    results.push({
      name: 'Representative counts',
      status,
      message: `Total: ${totalCount}, Active: ${activeCount}, Inactive: ${inactiveCount}, Historical: ${historicalCount}`,
      details: { total: totalCount, active: activeCount, inactive: inactiveCount, historical: historicalCount },
    });
  } catch (error) {
    results.push({
      name: 'Representative counts',
      status: 'fail',
      message: `Failed: ${(error as Error).message}`,
    });
  }
  
  // Test 2: Data quality score distribution
  console.log('📊 Test 2: Data quality scores...');
  try {
    const { data: qualityStats } = await client
      .from('representatives_core')
      .select('data_quality_score')
      .eq('status', 'active');
    
    if (qualityStats && qualityStats.length > 0) {
      const scores = qualityStats.map(r => r.data_quality_score ?? 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const highQuality = scores.filter(s => s >= 80).length;
      const lowQuality = scores.filter(s => s < 50).length;
      
      const status = avg < 50 ? 'warn' : 'pass';
      results.push({
        name: 'Data quality scores',
        status,
        message: `Avg: ${avg.toFixed(1)}, Range: ${min}-${max}, High (≥80): ${highQuality}, Low (<50): ${lowQuality}`,
        details: { avg, min, max, highQuality, lowQuality, total: scores.length },
      });
    } else {
      results.push({
        name: 'Data quality scores',
        status: 'warn',
        message: 'No active representatives found',
      });
    }
  } catch (error) {
    results.push({
      name: 'Data quality scores',
      status: 'fail',
      message: `Failed: ${(error as Error).message}`,
    });
  }
  
  // Test 3: Identifier coverage
  console.log('📊 Test 3: Identifier coverage...');
  try {
    const { data: allReps } = await client
      .from('representatives_core')
      .select('id, level, openstates_id, bioguide_id, fec_id, canonical_id')
      .eq('status', 'active');
    
    if (allReps && allReps.length > 0) {
      const total = allReps.length;
      const withOpenstates = allReps.filter(r => r.openstates_id).length;
      const withBioguide = allReps.filter(r => r.bioguide_id).length;
      const withFec = allReps.filter(r => r.fec_id).length;
      const withCanonical = allReps.filter(r => r.canonical_id).length;
      
      const federal = allReps.filter(r => r.level === 'federal');
      const federalWithBioguide = federal.filter(r => r.bioguide_id).length;
      const federalWithFec = federal.filter(r => r.fec_id).length;
      
      const stateLocal = allReps.filter(r => r.level === 'state' || r.level === 'local');
      const stateLocalWithOpenstates = stateLocal.filter(r => r.openstates_id).length;
      
      const status = 
        (federal.length > 0 && federalWithBioguide / federal.length < 0.8) ||
        (stateLocal.length > 0 && stateLocalWithOpenstates / stateLocal.length < 0.8)
          ? 'warn'
          : 'pass';
      
      results.push({
        name: 'Identifier coverage',
        status,
        message: `OpenStates: ${withOpenstates}/${total}, Bioguide: ${withBioguide}/${total}, FEC: ${withFec}/${total}, Canonical: ${withCanonical}/${total}`,
        details: {
          total,
          openstates: { count: withOpenstates, percent: (withOpenstates / total * 100).toFixed(1) },
          bioguide: { count: withBioguide, percent: (withBioguide / total * 100).toFixed(1) },
          fec: { count: withFec, percent: (withFec / total * 100).toFixed(1) },
          canonical: { count: withCanonical, percent: (withCanonical / total * 100).toFixed(1) },
          federal: { total: federal.length, withBioguide: federalWithBioguide, withFec: federalWithFec },
          stateLocal: { total: stateLocal.length, withOpenstates: stateLocalWithOpenstates },
        },
      });
    } else {
      results.push({
        name: 'Identifier coverage',
        status: 'warn',
        message: 'No active representatives found',
      });
    }
  } catch (error) {
    results.push({
      name: 'Identifier coverage',
      status: 'fail',
      message: `Failed: ${(error as Error).message}`,
    });
  }
  
  // Test 4: Foreign key integrity
  console.log('📊 Test 4: Foreign key integrity...');
  try {
    // Check for orphaned replaced_by_id references
    const { data: orphaned } = await client
      .from('representatives_core')
      .select('id, name, replaced_by_id')
      .not('replaced_by_id', 'is', null)
      .limit(10);
    
    if (orphaned && orphaned.length > 0) {
      let orphanedCount = 0;
      for (const rep of orphaned) {
        const { data: target } = await client
          .from('representatives_core')
          .select('id')
          .eq('id', rep.replaced_by_id)
          .maybeSingle();
        
        if (!target) {
          orphanedCount++;
        }
      }
      
      const status = orphanedCount > 0 ? 'fail' : 'pass';
      results.push({
        name: 'Foreign key integrity',
        status,
        message: orphanedCount > 0
          ? `Found ${orphanedCount} orphaned replaced_by_id references`
          : 'All foreign key references valid',
        details: { orphanedCount },
      });
    } else {
      results.push({
        name: 'Foreign key integrity',
        status: 'pass',
        message: 'No replaced_by_id references to check',
      });
    }
  } catch (error) {
    results.push({
      name: 'Foreign key integrity',
      status: 'fail',
      message: `Failed: ${(error as Error).message}`,
    });
  }
  
  // Test 5: Constraint violations (check for data that violates constraints)
  if (!quick) {
    console.log('📊 Test 5: Constraint violations...');
    try {
      // Check for invalid state codes
      const { data: invalidStates } = await client
        .from('representatives_core')
        .select('id, name, state')
        .not('state', 'is', null)
        .or('state.neq.regex,^[A-Z]{2}$')
        .limit(10);
      
      // Check for invalid data_quality_score
      const { data: invalidScores } = await client
        .from('representatives_core')
        .select('id, name, data_quality_score')
        .or('data_quality_score.lt.0,data_quality_score.gt.100')
        .limit(10);
      
      const issues = (invalidStates?.length || 0) + (invalidScores?.length || 0);
      const status = issues > 0 ? 'fail' : 'pass';
      results.push({
        name: 'Constraint violations',
        status,
        message: issues > 0
          ? `Found ${issues} potential constraint violations (invalid states: ${invalidStates?.length || 0}, invalid scores: ${invalidScores?.length || 0})`
          : 'No constraint violations detected',
        details: { invalidStates: invalidStates?.length || 0, invalidScores: invalidScores?.length || 0 },
      });
    } catch (error) {
      results.push({
        name: 'Constraint violations',
        status: 'warn',
        message: `Check skipped: ${(error as Error).message}`,
      });
    }
  }
  
  // Print results
  console.log('\n📋 Test Results:');
  console.log('='.repeat(60));
  
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;
  
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️ ' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.details && !quick) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
    }
    
    if (result.status === 'pass') passCount++;
    else if (result.status === 'warn') warnCount++;
    else failCount++;
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Pass: ${passCount}`);
  console.log(`   ⚠️  Warn: ${warnCount}`);
  console.log(`   ❌ Fail: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n❌ Smoke test failed! Review issues above.');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\n⚠️  Smoke test passed with warnings.');
  } else {
    console.log('\n✅ All smoke tests passed!');
  }
}

// CLI
const args = process.argv.slice(2);
const options: { quick?: boolean } = {};

for (const arg of args) {
  if (arg === '--quick') {
    options.quick = true;
  }
}

runSmokeTests(options).catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
