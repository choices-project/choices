#!/usr/bin/env node

/**
 * Check Existing Data
 * 
 * Script to check what data already exists in the database
 * to prevent duplication during processing
 */

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingData() {
  console.log('🔍 Checking existing data in database...\n');

  try {
    // Check representatives_core
    const { data: reps, error: repsError } = await supabase
      .from('representatives_core')
      .select('id, name, level, state, party, is_active, created_at')
      .order('created_at', { ascending: false });

    if (repsError) {
      console.error('❌ Error fetching representatives:', repsError);
      return;
    }

    console.log(`📊 Representatives Core: ${reps?.length || 0} records`);
    if (reps && reps.length > 0) {
      console.log('   Recent entries:');
      reps.slice(0, 5).forEach(rep => {
        console.log(`   - ${rep.name} (${rep.level}, ${rep.state}) - ${rep.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    // Check OpenStates data
    const { data: openstates, error: openstatesError } = await supabase
      .from('openstates_people_data')
      .select('id, name, state, created_at')
      .order('created_at', { ascending: false });

    if (openstatesError) {
      console.error('❌ Error fetching OpenStates data:', openstatesError);
    } else {
      console.log(`\n📊 OpenStates People Data: ${openstates?.length || 0} records`);
      if (openstates && openstates.length > 0) {
        console.log('   Recent entries:');
        openstates.slice(0, 5).forEach(person => {
          console.log(`   - ${person.name} (${person.state})`);
        });
      }
    }

    // Check crosswalk data
    const { data: crosswalk, error: crosswalkError } = await supabase
      .from('id_crosswalk')
      .select('canonical_id, source, source_id, entity_type')
      .order('created_at', { ascending: false });

    if (crosswalkError) {
      console.error('❌ Error fetching crosswalk data:', crosswalkError);
    } else {
      console.log(`\n📊 ID Crosswalk: ${crosswalk?.length || 0} records`);
      if (crosswalk && crosswalk.length > 0) {
        console.log('   Recent entries:');
        crosswalk.slice(0, 5).forEach(entry => {
          console.log(`   - ${entry.canonical_id} (${entry.source}: ${entry.source_id})`);
        });
      }
    }

    // Check for duplicates
    console.log('\n🔍 Checking for potential duplicates...');
    
    if (reps && reps.length > 0) {
      const nameCounts = {};
      reps.forEach(rep => {
        const key = `${rep.name}-${rep.level}-${rep.state}`;
        nameCounts[key] = (nameCounts[key] || 0) + 1;
      });

      const duplicates = Object.entries(nameCounts).filter(([key, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('   ⚠️  Potential duplicates found:');
        duplicates.forEach(([key, count]) => {
          console.log(`   - ${key}: ${count} entries`);
        });
      } else {
        console.log('   ✅ No duplicates found');
      }
    }

    console.log('\n✅ Data check complete!');

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

// Run the check
if (require.main === module) {
  checkExistingData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkExistingData };
