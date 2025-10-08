#!/usr/bin/env node

// Simple script to fix level classifications
// This will update state legislators to have level: "state" instead of level: "federal"

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLevelClassifications() {
  try {
    console.log('🔧 Fixing level classifications for state legislators...');

    // Update state legislators that are incorrectly marked as federal
    // Keep only actual federal representatives (U.S. Senate, U.S. House of Representatives)
    const { data: updatedReps, error: updateError } = await supabase
      .from('representatives_core')
      .update({ level: 'state' })
      .eq('level', 'federal')
      .neq('office', 'U.S. Senate')
      .neq('office', 'U.S. House of Representatives')
      .select('name, office, level, state, district');

    if (updateError) {
      console.error('❌ Error updating state representatives:', updateError);
      return;
    }

    console.log(`✅ Fixed level classifications for ${updatedReps?.length || 0} state legislators`);

    // Get updated counts
    const { data: federalCount } = await supabase
      .from('representatives_core')
      .select('id', { count: 'exact' })
      .eq('level', 'federal');

    const { data: stateCount } = await supabase
      .from('representatives_core')
      .select('id', { count: 'exact' })
      .eq('level', 'state');

    console.log(`\n🎉 Level classification fix completed!`);
    console.log(`   Federal representatives: ${federalCount?.length || 0}`);
    console.log(`   State representatives: ${stateCount?.length || 0}`);

    // Show the federal representatives
    const { data: federalReps } = await supabase
      .from('representatives_core')
      .select('name, office, level, district, party')
      .eq('level', 'federal');

    console.log(`\n📊 Federal Representatives:`);
    federalReps?.forEach(rep => {
      console.log(`   - ${rep.name} (${rep.office}) - ${rep.party}`);
    });

  } catch (error) {
    console.error('❌ Error fixing level classifications:', error);
  }
}

fixLevelClassifications();


// Simple script to fix level classifications
// This will update state legislators to have level: "state" instead of level: "federal"

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLevelClassifications() {
  try {
    console.log('🔧 Fixing level classifications for state legislators...');

    // Update state legislators that are incorrectly marked as federal
    // Keep only actual federal representatives (U.S. Senate, U.S. House of Representatives)
    const { data: updatedReps, error: updateError } = await supabase
      .from('representatives_core')
      .update({ level: 'state' })
      .eq('level', 'federal')
      .neq('office', 'U.S. Senate')
      .neq('office', 'U.S. House of Representatives')
      .select('name, office, level, state, district');

    if (updateError) {
      console.error('❌ Error updating state representatives:', updateError);
      return;
    }

    console.log(`✅ Fixed level classifications for ${updatedReps?.length || 0} state legislators`);

    // Get updated counts
    const { data: federalCount } = await supabase
      .from('representatives_core')
      .select('id', { count: 'exact' })
      .eq('level', 'federal');

    const { data: stateCount } = await supabase
      .from('representatives_core')
      .select('id', { count: 'exact' })
      .eq('level', 'state');

    console.log(`\n🎉 Level classification fix completed!`);
    console.log(`   Federal representatives: ${federalCount?.length || 0}`);
    console.log(`   State representatives: ${stateCount?.length || 0}`);

    // Show the federal representatives
    const { data: federalReps } = await supabase
      .from('representatives_core')
      .select('name, office, level, district, party')
      .eq('level', 'federal');

    console.log(`\n📊 Federal Representatives:`);
    federalReps?.forEach(rep => {
      console.log(`   - ${rep.name} (${rep.office}) - ${rep.party}`);
    });

  } catch (error) {
    console.error('❌ Error fixing level classifications:', error);
  }
}

fixLevelClassifications();
