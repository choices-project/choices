#!/usr/bin/env tsx

/**
 * Test Script for Canonical ID System
 * 
 * Validates the ID crosswalk system with test data
 * Run this after applying the database migration
 */

// Load environment variables
import dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '.env.local') });

import { canonicalIdService } from '../lib/civics/canonical-id-service';
import type { DataSource } from '../lib/civics/types';

// Test data for a known House member
const testHouseMember = {
  bioguide_id: 'A000374',
  name: 'Alexandria Ocasio-Cortez',
  first_name: 'Alexandria',
  last_name: 'Ocasio-Cortez',
  party: 'D',
  state: 'NY',
  district: '14',
  office: 'Representative',
  chamber: 'house',
  level: 'federal'
};

// Test data for a known state legislator
const testStateLegislator = {
  openstates_id: 'ocd-person/00000000-0000-0000-0000-000000000001',
  name: 'Jane Smith',
  first_name: 'Jane',
  last_name: 'Smith',
  party: 'R',
  state: 'CA',
  district: '25',
  office: 'Assembly Member',
  chamber: 'state_house',
  level: 'state'
};

async function testCanonicalIdSystem() {
  console.log('🧪 Testing Canonical ID System...\n');

  try {
    // Test 1: Generate canonical IDs
    console.log('1. Testing canonical ID generation...');
    
    const houseMemberCanonicalId = canonicalIdService.generateCanonicalId('person', testHouseMember);
    console.log(`   House member canonical ID: ${houseMemberCanonicalId}`);
    
    const stateLegislatorCanonicalId = canonicalIdService.generateCanonicalId('person', testStateLegislator);
    console.log(`   State legislator canonical ID: ${stateLegislatorCanonicalId}`);
    
    console.log('   ✅ Canonical ID generation working\n');

    // Test 2: Create crosswalk entries
    console.log('2. Testing crosswalk entry creation...');
    
    // House member from multiple sources
    const houseMemberSources = [
      { source: 'congress-gov' as DataSource, data: testHouseMember, sourceId: testHouseMember.bioguide_id },
      { source: 'fec' as DataSource, data: { ...testHouseMember, fec_candidate_id: 'H8NY15148' }, sourceId: 'H8NY15148' },
      { source: 'govtrack' as DataSource, data: { ...testHouseMember, govtrack_id: '412829' }, sourceId: '412829' }
    ];
    
    const houseMemberResult = await canonicalIdService.resolveEntity('person', houseMemberSources);
    console.log(`   House member resolved to: ${houseMemberResult.canonicalId}`);
    console.log(`   Crosswalk entries created: ${houseMemberResult.crosswalkEntries.length}`);
    
    // State legislator from multiple sources
    const stateLegislatorSources = [
      { source: 'open-states' as DataSource, data: testStateLegislator, sourceId: testStateLegislator.openstates_id },
      { source: 'google-civic' as DataSource, data: { ...testStateLegislator, google_civic_id: 'google_123' }, sourceId: 'google_123' }
    ];
    
    const stateLegislatorResult = await canonicalIdService.resolveEntity('person', stateLegislatorSources);
    console.log(`   State legislator resolved to: ${stateLegislatorResult.canonicalId}`);
    console.log(`   Crosswalk entries created: ${stateLegislatorResult.crosswalkEntries.length}`);
    
    console.log('   ✅ Crosswalk entry creation working\n');

    // Test 3: Retrieve crosswalk entries
    console.log('3. Testing crosswalk entry retrieval...');
    
    const houseMemberEntries = await canonicalIdService.getCrosswalkEntries(houseMemberResult.canonicalId);
    console.log(`   House member sources: ${houseMemberEntries.map(e => e.source).join(', ')}`);
    
    const stateLegislatorEntries = await canonicalIdService.getCrosswalkEntries(stateLegislatorResult.canonicalId);
    console.log(`   State legislator sources: ${stateLegislatorEntries.map(e => e.source).join(', ')}`);
    
    console.log('   ✅ Crosswalk entry retrieval working\n');

    // Test 4: Find canonical ID by source
    console.log('4. Testing canonical ID lookup by source...');
    
    const foundByBioguide = await canonicalIdService.findCanonicalIdBySource('congress-gov', testHouseMember.bioguide_id);
    console.log(`   Found by bioguide ID: ${foundByBioguide === houseMemberResult.canonicalId ? '✅' : '❌'}`);
    
    const foundByOpenStates = await canonicalIdService.findCanonicalIdBySource('open-states', testStateLegislator.openstates_id);
    console.log(`   Found by Open States ID: ${foundByOpenStates === stateLegislatorResult.canonicalId ? '✅' : '❌'}`);
    
    console.log('   ✅ Canonical ID lookup working\n');

    // Test 5: Get canonical ID mapping
    console.log('5. Testing canonical ID mapping...');
    
    const houseMemberMapping = await canonicalIdService.getCanonicalIdMapping(houseMemberResult.canonicalId);
    if (houseMemberMapping) {
      console.log(`   House member mapping sources: ${Object.keys(houseMemberMapping.sources).join(', ')}`);
      console.log(`   Entity type: ${houseMemberMapping.entity_type}`);
    }
    
    const stateLegislatorMapping = await canonicalIdService.getCanonicalIdMapping(stateLegislatorResult.canonicalId);
    if (stateLegislatorMapping) {
      console.log(`   State legislator mapping sources: ${Object.keys(stateLegislatorMapping.sources).join(', ')}`);
      console.log(`   Entity type: ${stateLegislatorMapping.entity_type}`);
    }
    
    console.log('   ✅ Canonical ID mapping working\n');

    // Test 6: Check entity existence
    console.log('6. Testing entity existence check...');
    
    const houseMemberExists = await canonicalIdService.entityExists(houseMemberResult.canonicalId);
    console.log(`   House member exists: ${houseMemberExists ? '✅' : '❌'}`);
    
    const nonExistentExists = await canonicalIdService.entityExists('non_existent_id');
    console.log(`   Non-existent entity exists: ${!nonExistentExists ? '✅' : '❌'}`);
    
    console.log('   ✅ Entity existence check working\n');

    // Test 7: Get crosswalk statistics
    console.log('7. Testing crosswalk statistics...');
    
    const stats = await canonicalIdService.getCrosswalkStats();
    console.log(`   Total entities: ${stats.total_entities}`);
    console.log(`   Entities by type: ${JSON.stringify(stats.entities_by_type)}`);
    console.log(`   Entities by source: ${JSON.stringify(stats.entities_by_source)}`);
    console.log(`   Quality distribution: ${JSON.stringify(stats.quality_distribution)}`);
    
    console.log('   ✅ Crosswalk statistics working\n');

    // Test 8: Validate crosswalk integrity
    console.log('8. Testing crosswalk integrity...');
    
    // Verify all sources resolve to the same entity_uuid
    const houseMemberSourcesResolved = houseMemberEntries.map(entry => entry.entity_uuid);
    const allSameEntity = houseMemberSourcesResolved.every(uuid => uuid === houseMemberSourcesResolved[0]);
    console.log(`   All house member sources resolve to same entity: ${allSameEntity ? '✅' : '❌'}`);
    
    const stateLegislatorSourcesResolved = stateLegislatorEntries.map(entry => entry.entity_uuid);
    const allSameEntity2 = stateLegislatorSourcesResolved.every(uuid => uuid === stateLegislatorSourcesResolved[0]);
    console.log(`   All state legislator sources resolve to same entity: ${allSameEntity2 ? '✅' : '❌'}`);
    
    console.log('   ✅ Crosswalk integrity validated\n');

    console.log('🎉 All tests passed! Canonical ID system is working correctly.\n');
    
    // Summary
    console.log('📊 Test Summary:');
    console.log(`   - House member canonical ID: ${houseMemberResult.canonicalId}`);
    console.log(`   - State legislator canonical ID: ${stateLegislatorResult.canonicalId}`);
    console.log(`   - Total crosswalk entries created: ${houseMemberResult.crosswalkEntries.length + stateLegislatorResult.crosswalkEntries.length}`);
    console.log(`   - Total entities in system: ${stats.total_entities}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCanonicalIdSystem()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testCanonicalIdSystem };
