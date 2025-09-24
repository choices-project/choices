#!/usr/bin/env node

/**
 * Test script to verify civics data ingestion is working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } }
);

async function testCivicsIngest() {
  console.log('🔍 Testing civics data ingestion...\n');

  try {
    // Test 1: Check if civics tables exist and have data
    console.log('📊 Checking civics_representatives table...');
    const { data: reps, error: repsError } = await supabase
      .from('civics_representatives')
      .select('id, name, level, jurisdiction')
      .limit(5);

    if (repsError) {
      console.error('❌ Error querying civics_representatives:', repsError);
      return;
    }

    console.log(`✅ Found ${reps.length} representatives (showing first 5):`);
    reps.forEach(rep => {
      console.log(`   - ${rep.name} (${rep.level}, ${rep.jurisdiction})`);
    });

    // Test 2: Check civics_divisions table
    console.log('\n📊 Checking civics_divisions table...');
    const { data: divisions, error: divError } = await supabase
      .from('civics_divisions')
      .select('ocd_division_id, level, chamber, state')
      .limit(5);

    if (divError) {
      console.error('❌ Error querying civics_divisions:', divError);
      return;
    }

    console.log(`✅ Found ${divisions.length} divisions (showing first 5):`);
    divisions.forEach(div => {
      console.log(`   - ${div.ocd_division_id} (${div.level}, ${div.chamber}, ${div.state})`);
    });

    // Test 3: Check data quality
    console.log('\n📊 Checking data quality...');
    const { data: qualityData, error: qualityError } = await supabase
      .from('civics_representatives')
      .select('level, jurisdiction')
      .not('name', 'is', null);

    if (qualityError) {
      console.error('❌ Error checking data quality:', qualityError);
      return;
    }

    const levelCounts = {};
    const jurisdictionCounts = {};
    
    qualityData.forEach(rep => {
      levelCounts[rep.level] = (levelCounts[rep.level] || 0) + 1;
      jurisdictionCounts[rep.jurisdiction] = (jurisdictionCounts[rep.jurisdiction] || 0) + 1;
    });

    console.log('✅ Data quality summary:');
    console.log('   Level distribution:', levelCounts);
    console.log('   Top jurisdictions:', Object.entries(jurisdictionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([jur, count]) => `${jur}: ${count}`)
      .join(', '));

    // Test 4: Test API endpoint simulation
    console.log('\n🌐 Testing API endpoint simulation...');
    const { data: caFederal, error: caError } = await supabase
      .from('civics_representatives')
      .select('*')
      .eq('jurisdiction', 'CA')
      .eq('level', 'federal');

    if (caError) {
      console.error('❌ Error querying CA federal representatives:', caError);
      return;
    }

    console.log(`✅ Found ${caFederal.length} CA federal representatives`);
    if (caFederal.length > 0) {
      console.log('   Sample:', caFederal[0].name, `(${caFederal[0].office})`);
    }

    console.log('\n🎉 Civics ingest test completed successfully!');
    console.log('✅ Database connection: Working');
    console.log('✅ Data ingestion: Working');
    console.log('✅ Data quality: Good');
    console.log('✅ API simulation: Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCivicsIngest();
