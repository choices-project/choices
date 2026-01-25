#!/usr/bin/env node
/**
 * Test script to check which FEC cycles have finance data available.
 * 
 * Tests a known candidate across multiple cycles to see which return totals.
 * 
 * Usage:
 *   npm run build && node build/scripts/tools/test-fec-cycles.js
 */
import 'dotenv/config';

import { fetchCandidateTotals } from '../clients/fec.js';

const TEST_CANDIDATE_ID = 'H8CA05035'; // Nancy Pelosi - likely to have data
const CYCLES_TO_TEST = [2020, 2022, 2024, 2026];

async function testCycle(cycle: number) {
  try {
    console.log(`\n📊 Testing cycle ${cycle}...`);
    const totals = await fetchCandidateTotals(TEST_CANDIDATE_ID, cycle);
    
    if (!totals) {
      console.log(`   ❌ No data returned`);
      return null;
    }
    
    const hasData = {
      total_receipts: totals.total_receipts != null,
      total_disbursements: totals.total_disbursements != null,
      cash_on_hand: totals.cash_on_hand_end_period != null,
      individual_contributions: totals.individual_contributions != null,
      last_filing_date: totals.last_filing_date != null,
    };
    
    const dataFields = Object.entries(hasData)
      .filter(([_, has]) => has)
      .map(([field]) => field);
    
    // Always show raw response to debug
    console.log(`   Raw API response:`, JSON.stringify(totals, null, 2));
    
    if (dataFields.length === 0) {
      console.log(`   ⚠️  Response received but all expected fields are null`);
      return null;
    }
    
    console.log(`   ✅ Data available for: ${dataFields.join(', ')}`);
    console.log(`   Total receipts: $${totals.total_receipts?.toLocaleString() ?? 'N/A'}`);
    console.log(`   Total disbursements: $${totals.total_disbursements?.toLocaleString() ?? 'N/A'}`);
    console.log(`   Cash on hand: $${totals.cash_on_hand_end_period?.toLocaleString() ?? 'N/A'}`);
    console.log(`   Last filing: ${totals.last_filing_date ?? 'N/A'}`);
    
    // Check for alternative field names
    const allKeys = Object.keys(totals);
    const expectedKeys = ['total_receipts', 'total_disbursements', 'cash_on_hand_end_period'];
    const missingKeys = expectedKeys.filter(key => !allKeys.includes(key));
    if (missingKeys.length > 0) {
      console.log(`   ⚠️  Missing expected fields: ${missingKeys.join(', ')}`);
      console.log(`   Available fields: ${allKeys.join(', ')}`);
    }
    
    return {
      cycle,
      hasData: true,
      totals,
    };
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 FEC Cycle Data Availability Test');
  console.log('='.repeat(50));
  console.log(`Testing candidate: ${TEST_CANDIDATE_ID} (Nancy Pelosi)`);
  console.log(`Cycles to test: ${CYCLES_TO_TEST.join(', ')}`);
  
  const results: Array<{ cycle: number; hasData: boolean; totals?: any }> = [];
  
  for (const cycle of CYCLES_TO_TEST) {
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Rate limit
    const result = await testCycle(cycle);
    if (result) {
      results.push(result);
    } else {
      results.push({ cycle, hasData: false });
    }
  }
  
  console.log('\n📊 Summary');
  console.log('='.repeat(50));
  const cyclesWithData = results.filter((r) => r.hasData).map((r) => r.cycle);
  const cyclesWithoutData = results.filter((r) => !r.hasData).map((r) => r.cycle);
  
  console.log(`✅ Cycles with data: ${cyclesWithData.length > 0 ? cyclesWithData.join(', ') : 'None'}`);
  console.log(`❌ Cycles without data: ${cyclesWithoutData.length > 0 ? cyclesWithoutData.join(', ') : 'None'}`);
  
  if (cyclesWithData.length > 0) {
    console.log('\n💡 Recommendation:');
    const mostRecent = Math.max(...cyclesWithData);
    console.log(`   Use cycle ${mostRecent} for current enrichment (most recent with data)`);
  } else {
    console.log('\n⚠️  Warning: No cycles returned data. This might indicate:');
    console.log('   - API key issues');
    console.log('   - Candidate ID issues');
    console.log('   - API endpoint changes');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}
