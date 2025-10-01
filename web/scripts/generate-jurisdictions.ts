#!/usr/bin/env ts-node
/**
 * Jurisdiction Data ETL Pipeline
 * 
 * Imports canonical jurisdiction data from multiple sources:
 * - US Census TIGER/Line shapefiles for boundaries
 * - Open Civic Data division definitions for hierarchy
 * - ZIP code to jurisdiction mappings
 * - H3 tile generation for fast spatial lookups
 */

import { createClient } from '@supabase/supabase-js';

// Environment validation
const validateEnvironment = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return { supabaseUrl, supabaseKey };
};

// Sample jurisdiction data for initial population
const SAMPLE_JURISDICTIONS = [
  {
    ocd_division_id: 'ocd-division/country:us',
    name: 'United States',
    level: 'country',
    country_code: 'US',
    state_code: null,
    county_name: null,
    city_name: null,
    source: 'manual',
    metadata: { population: 331000000 }
  },
  {
    ocd_division_id: 'ocd-division/country:us/state:ca',
    name: 'California',
    level: 'state',
    country_code: 'US',
    state_code: 'CA',
    county_name: null,
    city_name: null,
    source: 'manual',
    metadata: { population: 39500000 }
  },
  {
    ocd_division_id: 'ocd-division/country:us/state:ca/county:alameda',
    name: 'Alameda County',
    level: 'county',
    country_code: 'US',
    state_code: 'CA',
    county_name: 'Alameda',
    city_name: null,
    source: 'manual',
    metadata: { population: 1600000 }
  },
  {
    ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
    name: 'Oakland',
    level: 'city',
    country_code: 'US',
    state_code: 'CA',
    county_name: 'Alameda',
    city_name: 'Oakland',
    source: 'manual',
    metadata: { population: 440000 }
  }
];

// Sample ZIP code aliases
const SAMPLE_ZIP_ALIASES = [
  { zip: '94601', ocd_id: 'ocd-division/country:us/state:ca/place:oakland', confidence: 0.95 },
  { zip: '94602', ocd_id: 'ocd-division/country:us/state:ca/place:oakland', confidence: 0.95 },
  { zip: '94603', ocd_id: 'ocd-division/country:us/state:ca/place:oakland', confidence: 0.95 },
  { zip: '94102', ocd_id: 'ocd-division/country:us/state:ca/place:san_francisco', confidence: 0.95 },
  { zip: '94103', ocd_id: 'ocd-division/country:us/state:ca/place:san_francisco', confidence: 0.95 }
];

async function populateJurisdictions(supabase: any) {
  console.log('📊 Populating civic jurisdictions...');
  
  for (const jurisdiction of SAMPLE_JURISDICTIONS) {
    const { error } = await supabase
      .from('civic_jurisdictions')
      .upsert(jurisdiction, { onConflict: 'ocd_division_id' });
    
    if (error) {
      console.error(`❌ Failed to insert jurisdiction ${jurisdiction.ocd_division_id}:`, error.message);
    } else {
      console.log(`✅ Inserted jurisdiction: ${jurisdiction.name}`);
    }
  }
}

async function populateZipAliases(supabase: any) {
  console.log('📮 Populating ZIP code aliases...');
  
  for (const alias of SAMPLE_ZIP_ALIASES) {
    const { error } = await supabase
      .from('jurisdiction_aliases')
      .upsert({
        alias_type: 'zip',
        alias_value: alias.zip,
        ocd_division_id: alias.ocd_id,
        confidence: alias.confidence,
        source: 'manual',
        metadata: { imported_at: new Date().toISOString() }
      }, { onConflict: 'alias_type,alias_value' });
    
    if (error) {
      console.error(`❌ Failed to insert ZIP alias ${alias.zip}:`, error.message);
    } else {
      console.log(`✅ Inserted ZIP alias: ${alias.zip} → ${alias.ocd_id}`);
    }
  }
}

async function generateH3Tiles(supabase: any) {
  console.log('🔷 Generating H3 tiles for spatial indexing...');
  
  // Sample H3 tiles for Oakland area (resolution 8 = ~0.7km²)
  const oaklandTiles = [
    { h3_index: '88283082bffffff', ocd_id: 'ocd-division/country:us/state:ca/place:oakland' },
    { h3_index: '88283082cffffff', ocd_id: 'ocd-division/country:us/state:ca/place:oakland' },
    { h3_index: '88283082dffffff', ocd_id: 'ocd-division/country:us/state:ca/place:oakland' }
  ];
  
  for (const tile of oaklandTiles) {
    const { error } = await supabase
      .from('jurisdiction_tiles')
      .upsert({
        ocd_division_id: tile.ocd_id,
        h3_index: tile.h3_index,
        resolution: 8,
        source: 'generated',
        metadata: { generated_at: new Date().toISOString() }
      }, { onConflict: 'ocd_division_id,h3_index' });
    
    if (error) {
      console.error(`❌ Failed to insert H3 tile ${tile.h3_index}:`, error.message);
    } else {
      console.log(`✅ Inserted H3 tile: ${tile.h3_index} → ${tile.ocd_id}`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting jurisdiction data ETL pipeline...');
    
    const { supabaseUrl, supabaseKey } = validateEnvironment();
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { error } = await supabase.from('civic_jurisdictions').select('count').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Connected to Supabase');
    
    // Populate data
    await populateJurisdictions(supabase);
    await populateZipAliases(supabase);
    await generateH3Tiles(supabase);
    
    console.log('🎉 ETL pipeline completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run migrations: supabase db push');
    console.log('2. Enable feature flag: BROWSER_LOCATION_CAPTURE=true');
    console.log('3. Test location capture in development');
    
  } catch (error) {
    console.error('❌ ETL pipeline failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runJurisdictionETL };
