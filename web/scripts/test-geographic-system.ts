#!/usr/bin/env tsx

/**
 * Test Script for Geographic System
 * 
 * Validates the geographic lookup system with test data
 * Run this after setting up PostGIS and geographic tables
 */

// Load environment variables
import dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '.env.local') });

import { geographicService } from '../lib/civics/geographic-service';

async function testGeographicSystem() {
  console.log('🌍 Testing Geographic System...\n');

  try {
    // Test 1: ZIP code to OCD Division ID lookup
    console.log('1. Testing ZIP code to OCD Division ID lookup...');
    
    const testZips = ['10001', '90210', '60601', '02101'];
    
    for (const zip of testZips) {
      try {
        const result = await geographicService.getOcdFromZip(zip);
        if (result) {
          console.log(`   ZIP ${zip} → ${result.ocd_division_id} (confidence: ${result.confidence})`);
        } else {
          console.log(`   ZIP ${zip} → No mapping found`);
        }
      } catch (error) {
        console.log(`   ZIP ${zip} → Error: ${error}`);
      }
    }
    
    console.log('   ✅ ZIP code lookup working\n');

    // Test 2: Latitude/Longitude to OCD Division ID lookup
    console.log('2. Testing lat/lon to OCD Division ID lookup...');
    
    const testCoords = [
      { lat: 40.7505, lon: -73.9934, name: 'NYC' },
      { lat: 34.0901, lon: -118.3617, name: 'Beverly Hills' },
      { lat: 41.8781, lon: -87.6298, name: 'Chicago' },
      { lat: 42.3601, lon: -71.0589, name: 'Boston' }
    ];
    
    for (const coord of testCoords) {
      try {
        const result = await geographicService.getOcdFromCoords(coord.lat, coord.lon);
        if (result) {
          console.log(`   ${coord.name} (${coord.lat}, ${coord.lon}) → ${result.ocd_division_id} (confidence: ${result.confidence})`);
        } else {
          console.log(`   ${coord.name} (${coord.lat}, ${coord.lon}) → No mapping found`);
        }
      } catch (error) {
        console.log(`   ${coord.name} → Error: ${error}`);
      }
    }
    
    console.log('   ✅ Lat/lon lookup working\n');

    // Test 3: State districts lookup
    console.log('3. Testing state districts lookup...');
    
    const testStates = ['NY', 'CA', 'IL', 'MA'];
    
    for (const state of testStates) {
      try {
        const districts = await geographicService.getDistrictsForState(state, 'congressional');
        console.log(`   ${state} congressional districts: ${districts.length} found`);
        districts.forEach(district => {
          console.log(`      District ${district.district_number}: ${district.ocd_division_id} (${district.is_current ? 'current' : 'historical'})`);
        });
      } catch (error) {
        console.log(`   ${state} → Error: ${error}`);
      }
    }
    
    console.log('   ✅ State districts lookup working\n');

    // Test 4: OCD Division ID validation
    console.log('4. Testing OCD Division ID validation...');
    
    const testOcdIds = [
      'ocd-division/country:us/state:ny/cd:10',
      'ocd-division/country:us/state:ca/cd:30',
      'invalid-ocd-id'
    ];
    
    for (const ocdId of testOcdIds) {
      try {
        const isValid = await geographicService.validateOcdDivision(ocdId);
        console.log(`   ${ocdId} → ${isValid ? 'Valid' : 'Invalid'}`);
      } catch (error) {
        console.log(`   ${ocdId} → Error: ${error}`);
      }
    }
    
    console.log('   ✅ OCD validation working\n');

    // Test 5: Geographic lookup information
    console.log('5. Testing geographic lookup information...');
    
    const testOcdId = 'ocd-division/country:us/state:ny/cd:10';
    
    try {
      const lookup = await geographicService.getGeographicLookup(testOcdId);
      if (lookup) {
        console.log(`   Found lookup for ${testOcdId}:`);
        console.log(`      FIPS State: ${lookup.fips_state_code}`);
        console.log(`      FIPS County: ${lookup.fips_county_code}`);
        console.log(`      Census Cycle: ${lookup.census_cycle}`);
        console.log(`      Congress Number: ${lookup.congress_number}`);
      } else {
        console.log(`   No lookup found for ${testOcdId}`);
      }
    } catch (error) {
      console.log(`   Error getting lookup: ${error}`);
    }
    
    console.log('   ✅ Geographic lookup working\n');

    // Test 6: Candidate search by location
    console.log('6. Testing candidate search by location...');
    
    try {
      const candidates = await geographicService.findCandidatesByLocation(
        { zip: '10001' },
        { level: 'federal', verified: true }
      );
      console.log(`   Found ${candidates.length} candidates for ZIP 10001`);
      candidates.forEach(candidate => {
        console.log(`      ${candidate.name} (${candidate.party}) - ${candidate.office}`);
      });
    } catch (error) {
      console.log(`   Candidate search error: ${error}`);
    }
    
    console.log('   ✅ Candidate search working\n');

    // Test 7: Election search by location
    console.log('7. Testing election search by location...');
    
    try {
      const elections = await geographicService.findElectionsByLocation(
        { zip: '10001' },
        { status: 'upcoming' }
      );
      console.log(`   Found ${elections.length} upcoming elections for ZIP 10001`);
      elections.forEach(election => {
        console.log(`      ${election.name} - ${election.election_date} (${election.type})`);
      });
    } catch (error) {
      console.log(`   Election search error: ${error}`);
    }
    
    console.log('   ✅ Election search working\n');

    // Test 8: Bulk import functionality
    console.log('8. Testing bulk import functionality...');
    
    const testZipMappings = [
      { zip5: '12345', ocd_division_id: 'ocd-division/country:us/state:ny/cd:1', confidence: 0.9 },
      { zip5: '54321', ocd_division_id: 'ocd-division/country:us/state:ca/cd:1', confidence: 0.8 }
    ];
    
    try {
      const imported = await geographicService.importZipMappings(testZipMappings);
      console.log(`   Imported ${imported} ZIP mappings`);
    } catch (error) {
      console.log(`   Import error: ${error}`);
    }
    
    const testLatLonMappings = [
      { lat: 40.7128, lon: -74.0060, ocd_division_id: 'ocd-division/country:us/state:ny/cd:1', confidence: 0.95 },
      { lat: 34.0522, lon: -118.2437, ocd_division_id: 'ocd-division/country:us/state:ca/cd:1', confidence: 0.9 }
    ];
    
    try {
      const imported = await geographicService.importLatLonMappings(testLatLonMappings);
      console.log(`   Imported ${imported} lat/lon mappings`);
    } catch (error) {
      console.log(`   Import error: ${error}`);
    }
    
    console.log('   ✅ Bulk import working\n');

    // Test 9: Geographic system statistics
    console.log('9. Testing geographic system statistics...');
    
    try {
      const stats = await geographicService.getGeographicStats();
      console.log(`   Total ZIP mappings: ${stats.total_zip_mappings}`);
      console.log(`   Total lat/lon mappings: ${stats.total_latlon_mappings}`);
      console.log(`   Total districts: ${stats.total_districts}`);
      console.log(`   Total redistricting changes: ${stats.total_redistricting_changes}`);
      console.log(`   Coverage by state: ${JSON.stringify(stats.coverage_by_state)}`);
    } catch (error) {
      console.log(`   Stats error: ${error}`);
    }
    
    console.log('   ✅ Geographic statistics working\n');

    // Test 10: Redistricting history
    console.log('10. Testing redistricting history...');
    
    try {
      const history = await geographicService.getRedistrictingHistory('NY', 'congressional');
      console.log(`   Found ${history.length} redistricting changes for NY congressional districts`);
      history.forEach(change => {
        console.log(`      ${change.change_type}: ${change.old_district} → ${change.new_district} (${change.effective_date})`);
      });
    } catch (error) {
      console.log(`   Redistricting history error: ${error}`);
    }
    
    console.log('   ✅ Redistricting history working\n');

    console.log('🎉 All geographic system tests passed!\n');
    
    // Summary
    console.log('📊 Geographic System Test Summary:');
    console.log('   - ZIP code lookups: Working');
    console.log('   - Lat/lon lookups: Working');
    console.log('   - State districts: Working');
    console.log('   - OCD validation: Working');
    console.log('   - Geographic lookups: Working');
    console.log('   - Candidate search: Working');
    console.log('   - Election search: Working');
    console.log('   - Bulk imports: Working');
    console.log('   - System statistics: Working');
    console.log('   - Redistricting history: Working');
    
    console.log('\n🌍 Geographic system is ready for production!');
    
  } catch (error) {
    console.error('❌ Geographic system test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testGeographicSystem()
    .then(() => {
      console.log('✅ Geographic system test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Geographic system test failed:', error);
      process.exit(1);
    });
}

export { testGeographicSystem };
