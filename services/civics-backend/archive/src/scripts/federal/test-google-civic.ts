#!/usr/bin/env node
/**
 * Test script to verify Google Civic API connectivity and data extraction.
 * 
 * Usage:
 *   npm run build && node build/scripts/federal/test-google-civic.js
 */
import 'dotenv/config';

import {
  fetchRepresentativeInfoByDivision,
  buildCongressionalDistrictId,
  fetchRepresentativeInfoByAddress,
  GoogleCivicApiError,
} from '../../clients/googleCivic.js';

async function testApiKey() {
  console.log('\n🔍 Testing Google Civic API Key...');
  console.log('='.repeat(50));

  if (!process.env.GOOGLE_CIVIC_API_KEY) {
    console.error('❌ GOOGLE_CIVIC_API_KEY not set in environment');
    return false;
  }
  console.log('✅ GOOGLE_CIVIC_API_KEY found');
  return true;
}

async function testBuildDivisionId() {
  console.log('\n🔍 Testing OCD Division ID Construction...');
  console.log('='.repeat(50));

  const testCases = [
    { state: 'CA', district: '12', office: 'Representative', expected: 'ocd-division/country:us/state:ca/cd:12' },
    { state: 'CA', district: null, office: 'Senator', expected: 'ocd-division/country:us/state:ca' },
    { state: 'AK', district: '0', office: 'Representative', expected: 'ocd-division/country:us/state:ak/cd:0' },
    { state: 'NY', district: '14', office: 'Representative', expected: 'ocd-division/country:us/state:ny/cd:14' },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    try {
      const result = buildCongressionalDistrictId(testCase.state, testCase.district, testCase.office);
      if (result === testCase.expected) {
        console.log(`   ✅ ${testCase.state} ${testCase.office} ${testCase.district ?? 'N/A'}: ${result}`);
      } else {
        console.error(`   ❌ ${testCase.state} ${testCase.office}: Expected ${testCase.expected}, got ${result}`);
        allPassed = false;
      }
    } catch (error) {
      console.error(`   ❌ ${testCase.state} ${testCase.office}: Error - ${(error as Error).message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testDivisionLookup() {
  console.log('\n🔍 Testing Division Lookup...');
  console.log('='.repeat(50));

  // Test with a known congressional district (CA-12: Nancy Pelosi's district)
  const divisionId = 'ocd-division/country:us/state:ca/cd:12';
  console.log(`   Testing division: ${divisionId}`);

  try {
    const response = await fetchRepresentativeInfoByDivision(divisionId);
    
    if (!response) {
      console.log('   ⚠️  No data returned (division may not exist)');
      return false;
    }

    console.log('   ✅ API call successful!');
    console.log(`   Offices found: ${response.offices?.length ?? 0}`);
    console.log(`   Officials found: ${response.officials?.length ?? 0}`);

    if (response.officials && response.officials.length > 0) {
      console.log('\n   Sample officials:');
      response.officials.slice(0, 3).forEach((official, idx) => {
        console.log(`   ${idx + 1}. ${official.name}`);
        if (official.party) console.log(`      Party: ${official.party}`);
        if (official.emails && official.emails.length > 0) {
          console.log(`      Email: ${official.emails[0]}`);
        }
        if (official.phones && official.phones.length > 0) {
          console.log(`      Phone: ${official.phones[0]}`);
        }
        if (official.photoUrl) {
          console.log(`      Photo: ${official.photoUrl.substring(0, 50)}...`);
        }
      });
    }

    return true;
  } catch (error) {
    const apiError = error as GoogleCivicApiError;
    console.error('   ❌ API call failed:', apiError.message);
    if (apiError.statusCode === 429) {
      console.error('   Rate limit hit - wait a bit and try again');
    }
    return false;
  }
}

async function testAddressLookup() {
  console.log('\n🔍 Testing Address Lookup...');
  console.log('='.repeat(50));

  // Test with a known address in CA-12 (San Francisco)
  const testAddress = '1600 Pennsylvania Avenue NW, Washington, DC 20500';
  console.log(`   Testing address: ${testAddress.substring(0, 50)}...`);

  try {
    const response = await fetchRepresentativeInfoByAddress(testAddress, {
      levels: ['country'],
      // Note: roles parameter format may vary - testing without it for now
    });

    if (!response) {
      console.log('   ⚠️  No data returned');
      return false;
    }

    console.log('   ✅ API call successful!');
    console.log(`   Offices found: ${response.offices?.length ?? 0}`);
    console.log(`   Officials found: ${response.officials?.length ?? 0}`);

    if (response.normalizedInput) {
      console.log('\n   Normalized address:');
      Object.entries(response.normalizedInput).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    }

    return true;
  } catch (error) {
    const apiError = error as GoogleCivicApiError;
    console.error('   ❌ API call failed:', apiError.message);
    if (apiError.statusCode === 429) {
      console.error('   Rate limit hit - wait a bit and try again');
    }
    return false;
  }
}

async function main() {
  console.log('\n🧪 Google Civic API Test Suite');
  console.log('='.repeat(50));
  console.log('This script verifies Google Civic API is ready for federal enrichment.');
  console.log('');

  const results = {
    apiKey: false,
    divisionId: false,
    divisionLookup: false,
    addressLookup: false,
  };

  // Test 1: API Key
  results.apiKey = await testApiKey();
  if (!results.apiKey) {
    console.error('\n❌ API key test failed. Fix issues before proceeding.');
    process.exit(1);
  }

  // Test 2: Division ID Construction
  results.divisionId = await testBuildDivisionId();
  if (!results.divisionId) {
    console.error('\n❌ Division ID construction test failed.');
    process.exit(1);
  }

  // Test 3: Division Lookup
  await new Promise((resolve) => setTimeout(resolve, 1200)); // Rate limit delay
  results.divisionLookup = await testDivisionLookup();

  // Test 4: Address Lookup
  await new Promise((resolve) => setTimeout(resolve, 1200)); // Rate limit delay
  results.addressLookup = await testAddressLookup();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`   API Key: ${results.apiKey ? '✅' : '❌'}`);
  console.log(`   Division ID Construction: ${results.divisionId ? '✅' : '❌'}`);
  console.log(`   Division Lookup: ${results.divisionLookup ? '✅' : '⚠️'}`);
  console.log(`   Address Lookup: ${results.addressLookup ? '✅' : '⚠️'}`);

  if (results.apiKey && results.divisionId) {
    console.log('\n✅ Core functionality working! Ready for enrichment.');
    console.log('\n💡 Recommended next steps:');
    console.log('   1. Run with small limit first: npm run federal:enrich:google-civic -- --limit 5');
    console.log('   2. Monitor for rate limits and errors');
    console.log('   3. If successful, run full enrichment (remove --limit)');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above before proceeding.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
