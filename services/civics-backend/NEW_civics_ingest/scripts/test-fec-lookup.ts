#!/usr/bin/env node
/**
 * Test FEC ID lookup with various name formats and search strategies.
 * 
 * Usage:
 *   npm run tools:test:fec-lookup [--name="John Smith"] [--state=CA] [--office=H]
 */
import 'dotenv/config';

import { searchCandidates, searchCandidateWithTotals } from '../clients/fec.js';
import { getSupabaseClient } from '../clients/supabase.js';

async function testFecLookup() {
  const args = process.argv.slice(2);
  const testName = args.find(a => a.startsWith('--name='))?.split('=')[1];
  const testState = args.find(a => a.startsWith('--state='))?.split('=')[1];
  const testOffice = args.find(a => a.startsWith('--office='))?.split('=')[1] as 'H' | 'S' | undefined;

  if (testName) {
    console.log(`\n🔍 Testing FEC lookup for: ${testName}`);
    console.log('='.repeat(60));
    
    // Test 1: Exact name with office and state
    console.log('\n1. Testing exact name with office and state:');
    try {
      const result1 = await searchCandidateWithTotals({
        name: testName,
        office: testOffice,
        state: testState,
        cycle: 2026,
        per_page: 10,
      });
      console.log('   Result:', result1.candidate ? `Found: ${result1.candidate.candidate_id} (${result1.candidate.name})` : 'No match');
    } catch (error) {
      console.error('   Error:', (error as Error).message);
    }

    // Test 2: Name only (no office/state filter)
    console.log('\n2. Testing name only (no filters):');
    try {
      const candidates = await searchCandidates({
        name: testName,
        per_page: 20,
      });
      console.log(`   Found ${candidates.length} candidates:`);
      candidates.slice(0, 5).forEach(c => {
        console.log(`     - ${c.name} (${c.candidate_id}) - ${c.office_full} ${c.state}${c.district ? `-${c.district}` : ''}`);
      });
    } catch (error) {
      console.error('   Error:', (error as Error).message);
    }

    // Test 3: Try "Last, First" format if name has space
    if (testName.includes(' ')) {
      const parts = testName.split(' ');
      const lastFirst = `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
      console.log(`\n3. Testing "Last, First" format: "${lastFirst}"`);
      try {
        const candidates = await searchCandidates({
          name: lastFirst,
          office: testOffice,
          state: testState,
          per_page: 10,
        });
        console.log(`   Found ${candidates.length} candidates:`);
        candidates.slice(0, 3).forEach(c => {
          console.log(`     - ${c.name} (${c.candidate_id}) - ${c.office_full} ${c.state}`);
        });
      } catch (error) {
        console.error('   Error:', (error as Error).message);
      }
    }

    // Test 4: Try last name only
    if (testName.includes(' ')) {
      const lastName = testName.split(' ').pop();
      console.log(`\n4. Testing last name only: "${lastName}"`);
      try {
        const candidates = await searchCandidates({
          name: lastName,
          office: testOffice,
          state: testState,
          per_page: 10,
        });
        console.log(`   Found ${candidates.length} candidates:`);
        candidates.slice(0, 3).forEach(c => {
          console.log(`     - ${c.name} (${c.candidate_id}) - ${c.office_full} ${c.state}`);
        });
      } catch (error) {
        console.error('   Error:', (error as Error).message);
      }
    }

    return;
  }

  // If no test name, get sample from database
  console.log('\n🔍 Testing FEC lookup with sample representatives...');
  console.log('='.repeat(60));

  const client = getSupabaseClient();
  const { data: sampleReps } = await client
    .from('representatives_core')
    .select('name, office, state, district')
    .eq('level', 'federal')
    .eq('status', 'active')
    .is('fec_id', null)
    .limit(5);

  if (!sampleReps || sampleReps.length === 0) {
    console.log('No representatives without FEC IDs found.');
    return;
  }

  for (const rep of sampleReps) {
    console.log(`\n📋 Testing: ${rep.name} (${rep.office}, ${rep.state}${rep.district ? `-${rep.district}` : ''})`);
    
    const fecOffice = rep.office === 'Senator' ? 'S' : rep.office === 'Representative' ? 'H' : undefined;
    
    // Test multiple strategies
    const strategies = [
      { name: rep.name, office: fecOffice, state: rep.state },
      { name: rep.name, office: fecOffice }, // No state
      { name: rep.name }, // Name only
    ];

    // If name has space, try "Last, First"
    if (rep.name.includes(' ')) {
      const parts = rep.name.split(' ');
      const lastFirst = `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
      strategies.push({ name: lastFirst, office: fecOffice, state: rep.state });
    }

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      try {
        const candidates = await searchCandidates({
          name: strategy.name,
          office: strategy.office as 'H' | 'S' | undefined,
          state: strategy.state ?? undefined,
          per_page: 5,
        });

        if (candidates.length > 0) {
          console.log(`   ✅ Strategy ${i + 1} (${JSON.stringify(strategy)}): Found ${candidates.length} candidates`);
          candidates.slice(0, 2).forEach(c => {
            console.log(`      - ${c.name} (${c.candidate_id}) - ${c.office_full} ${c.state}${c.district ? `-${c.district}` : ''}`);
          });
          break; // Found a match, move to next rep
        } else {
          console.log(`   ❌ Strategy ${i + 1} (${JSON.stringify(strategy)}): No matches`);
        }
      } catch (error) {
        console.log(`   ⚠️  Strategy ${i + 1} (${JSON.stringify(strategy)}): Error - ${(error as Error).message}`);
      }
      
      // Throttle between attempts
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
}

testFecLookup().catch(console.error);
