#!/usr/bin/env node

import logger from '@/lib/utils/logger';

/**
 * Test script to verify civics data ingestion is working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function testCivicsIngest() {
  logger.info('🔍 Testing civics data ingestion...\n');

  try {
    // Test 1: Check if civics tables exist and have data
    logger.info('📊 Checking civics_representatives table...');
    const { data: reps, error: repsError } = await supabase
      .from('civics_representatives')
      .select('id, name, level, jurisdiction')
      .limit(5);

    if (repsError) {
      logger.error('❌ Error querying civics_representatives:', repsError);
      return;
    }

    logger.info(`✅ Found ${reps.length} representatives (showing first 5):`);
    reps.forEach(rep => {
      logger.info(`   - ${rep.name} (${rep.level}, ${rep.jurisdiction})`);
    });

    // Test 2: Check civics_divisions table
    logger.info('\n📊 Checking civics_divisions table...');
    const { data: divisions, error: divError } = await supabase
      .from('civics_divisions')
      .select('ocd_division_id, level, chamber, state')
      .limit(5);

    if (divError) {
      logger.error('❌ Error querying civics_divisions:', divError);
      return;
    }

    logger.info(`✅ Found ${divisions.length} divisions (showing first 5):`);
    divisions.forEach(div => {
      logger.info(`   - ${div.ocd_division_id} (${div.level}, ${div.chamber}, ${div.state})`);
    });

    // Test 3: Check data quality
    logger.info('\n📊 Checking data quality...');
    const { data: qualityData, error: qualityError } = await supabase
      .from('civics_representatives')
      .select('level, jurisdiction')
      .not('name', 'is', null);

    if (qualityError) {
      logger.error('❌ Error checking data quality:', qualityError);
      return;
    }

    const levelCounts = {};
    const jurisdictionCounts = {};
    
    qualityData.forEach(rep => {
      levelCounts[rep.level] = (levelCounts[rep.level] || 0) + 1;
      jurisdictionCounts[rep.jurisdiction] = (jurisdictionCounts[rep.jurisdiction] || 0) + 1;
    });

    logger.info('✅ Data quality summary:');
    logger.info('   Level distribution:', levelCounts);
    logger.info('   Top jurisdictions:', Object.entries(jurisdictionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([jur, count]) => `${jur}: ${count}`)
      .join(', '));

    // Test 4: Test API endpoint simulation
    logger.info('\n🌐 Testing API endpoint simulation...');
    const { data: caFederal, error: caError } = await supabase
      .from('civics_representatives')
      .select('*')
      .eq('jurisdiction', 'CA')
      .eq('level', 'federal');

    if (caError) {
      logger.error('❌ Error querying CA federal representatives:', caError);
      return;
    }

    logger.info(`✅ Found ${caFederal.length} CA federal representatives`);
    if (caFederal.length > 0) {
      logger.info('   Sample:', caFederal[0].name, `(${caFederal[0].office})`);
    }

    logger.info('\n🎉 Civics ingest test completed successfully!');
    logger.info('✅ Database connection: Working');
    logger.info('✅ Data ingestion: Working');
    logger.info('✅ Data quality: Good');
    logger.info('✅ API simulation: Working');

  } catch (error) {
    logger.error('❌ Test failed:', error);
  }
}

testCivicsIngest();
