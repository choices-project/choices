/**
 * Test Current Representative Filtering Fix
 * 
 * This script tests the fixed filtering logic to ensure
 * expired representatives are properly filtered out.
 */

const BASE_URL = 'http://localhost:3000';

async function testFilteringFix() {
  console.log('🧪 TESTING FILTERING FIX');
  console.log('=========================');
  console.log('');

  try {
    // Test with Biden (should be filtered out - term expired)
    console.log('1. Testing Biden (should be FILTERED OUT):');
    console.log('   Term: 2021-01-20 to 2025-01-20');
    console.log('   Current Date: October 6, 2025');
    console.log('   Status: Term expired 8+ months ago');
    console.log('');

    const bidenTest = await fetch(`${BASE_URL}/api/civics/maximized-api-ingestion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify({
        representatives: [{
          name: "Joe Biden",
          state: "DE",
          office: "President",
          level: "federal",
          district: null,
          congressGovId: "B000755",
          bioguideId: "B000755",
          fecId: "S8DE00096",
          termStartDate: "2021-01-20",
          termEndDate: "2025-01-20",
          nextElectionDate: "2024-11-05",
          lastUpdated: new Date().toISOString()
        }]
      })
    });

    const bidenResult = await bidenTest.json();
    console.log('   Result:', bidenResult.results);
    
    if (bidenResult.results.processed === 0) {
      console.log('   ✅ PASS: Biden correctly filtered out');
    } else {
      console.log('   ❌ FAIL: Biden was processed (should be filtered out)');
    }
    console.log('');

    // Test with current representative (should be processed)
    console.log('2. Testing Current Representative (should be PROCESSED):');
    console.log('   Term: 2025-01-01 to 2027-01-01');
    console.log('   Current Date: October 6, 2025');
    console.log('   Status: Term is current');
    console.log('');

    const currentTest = await fetch(`${BASE_URL}/api/civics/maximized-api-ingestion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify({
        representatives: [{
          name: "Current Representative",
          state: "CA",
          office: "Governor",
          level: "state",
          district: null,
          openstatesId: "ocd-person/current123",
          termStartDate: "2025-01-01",
          termEndDate: "2027-01-01",
          nextElectionDate: "2026-11-03",
          lastUpdated: new Date().toISOString()
        }]
      })
    });

    const currentResult = await currentTest.json();
    console.log('   Result:', currentResult.results);
    
    if (currentResult.results.processed === 1) {
      console.log('   ✅ PASS: Current representative correctly processed');
    } else {
      console.log('   ❌ FAIL: Current representative was filtered out (should be processed)');
    }
    console.log('');

    // Check database status
    console.log('3. Checking Database Status:');
    const statusResponse = await fetch(`${BASE_URL}/api/civics/ingestion-status`);
    const status = await statusResponse.json();
    console.log(`   Total Representatives: ${status.status.ingestion.progress.totalRepresentatives}`);
    console.log(`   States with Data: ${status.status.ingestion.progress.statesWithData}`);
    console.log(`   Multi-Source Coverage: ${status.status.ingestion.progress.multiSourcePercentage}%`);
    console.log('');

    console.log('🎯 FILTERING TEST COMPLETE');
    console.log('==========================');
    console.log('✅ If Biden was filtered out and current rep was processed, filtering is working');
    console.log('❌ If Biden was processed, filtering is still broken');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFilteringFix();
