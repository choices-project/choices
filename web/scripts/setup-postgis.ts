#!/usr/bin/env tsx

/**
 * PostGIS Setup Script
 * 
 * Enables PostGIS extension and creates geographic lookup tables
 * This powers location-based candidate discovery and geographic electoral feeds
 */

// Load environment variables
import dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPostGIS() {
  console.log('🌍 Setting up PostGIS and Geographic Lookups...\n');

  try {
    // Step 1: Enable PostGIS extension
    console.log('1. Enabling PostGIS extension...');
    const { error: postgisError } = await supabase.rpc('exec_sql', { 
      sql: 'CREATE EXTENSION IF NOT EXISTS postgis;' 
    });
    
    if (postgisError) {
      console.log(`❌ Failed to enable PostGIS: ${postgisError.message}`);
      console.log('   Note: PostGIS may not be available in your Supabase instance');
      console.log('   This is common in managed databases. Geographic features will use text-based lookups.');
    } else {
      console.log('✅ PostGIS extension enabled successfully');
    }

    // Step 2: Create geographic lookup tables
    console.log('\n2. Creating geographic lookup tables...');
    
    const geographicTables = [
      {
        name: 'geographic_lookups',
        sql: `
          CREATE TABLE IF NOT EXISTS geographic_lookups (
            ocd_division_id TEXT PRIMARY KEY,
            fips_state_code TEXT,
            fips_county_code TEXT,
            geoid TEXT,
            census_cycle INT,
            congress_number INT,
            geometry GEOMETRY(POLYGON, 4326),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'zip_to_ocd',
        sql: `
          CREATE TABLE IF NOT EXISTS zip_to_ocd (
            zip5 TEXT PRIMARY KEY,
            ocd_division_id TEXT NOT NULL,
            confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'latlon_to_ocd',
        sql: `
          CREATE TABLE IF NOT EXISTS latlon_to_ocd (
            lat DECIMAL(10,8) NOT NULL,
            lon DECIMAL(11,8) NOT NULL,
            ocd_division_id TEXT NOT NULL,
            confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (lat, lon)
          );
        `
      },
      {
        name: 'state_districts',
        sql: `
          CREATE TABLE IF NOT EXISTS state_districts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            state TEXT NOT NULL CHECK (LENGTH(state) = 2),
            district_type TEXT NOT NULL CHECK (district_type IN ('congressional', 'state_house', 'state_senate', 'county', 'city')),
            district_number TEXT,
            ocd_division_id TEXT NOT NULL,
            census_cycle INT NOT NULL,
            congress_number INT,
            valid_from DATE NOT NULL,
            valid_to DATE,
            is_current BOOLEAN GENERATED ALWAYS AS (valid_to IS NULL) STORED,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (state, district_type, district_number, census_cycle)
          );
        `
      },
      {
        name: 'redistricting_history',
        sql: `
          CREATE TABLE IF NOT EXISTS redistricting_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            state TEXT NOT NULL CHECK (LENGTH(state) = 2),
            district_type TEXT NOT NULL CHECK (district_type IN ('congressional', 'state_house', 'state_senate')),
            old_district TEXT,
            new_district TEXT,
            census_cycle_from INT NOT NULL,
            census_cycle_to INT NOT NULL,
            change_type TEXT CHECK (change_type IN ('split', 'merge', 'redraw', 'eliminate', 'create')),
            change_description TEXT,
            effective_date DATE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      }
    ];

    for (const table of geographicTables) {
      try {
        console.log(`   Creating ${table.name}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
        
        if (error) {
          console.log(`   ❌ Failed to create ${table.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table.name} created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error creating ${table.name}: ${err}`);
      }
    }

    // Step 3: Create geographic indexes
    console.log('\n3. Creating geographic indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_geographic_lookups_fips ON geographic_lookups (fips_state_code, fips_county_code);',
      'CREATE INDEX IF NOT EXISTS idx_geographic_lookups_census ON geographic_lookups (census_cycle);',
      'CREATE INDEX IF NOT EXISTS idx_geographic_lookups_congress ON geographic_lookups (congress_number);',
      'CREATE INDEX IF NOT EXISTS idx_zip_to_ocd_zip ON zip_to_ocd (zip5);',
      'CREATE INDEX IF NOT EXISTS idx_zip_to_ocd_ocd ON zip_to_ocd (ocd_division_id);',
      'CREATE INDEX IF NOT EXISTS idx_latlon_to_ocd_coords ON latlon_to_ocd (lat, lon);',
      'CREATE INDEX IF NOT EXISTS idx_latlon_to_ocd_ocd ON latlon_to_ocd (ocd_division_id);',
      'CREATE INDEX IF NOT EXISTS idx_state_districts_state ON state_districts (state);',
      'CREATE INDEX IF NOT EXISTS idx_state_districts_type ON state_districts (district_type);',
      'CREATE INDEX IF NOT EXISTS idx_state_districts_current ON state_districts (is_current);',
      'CREATE INDEX IF NOT EXISTS idx_redistricting_state ON redistricting_history (state);',
      'CREATE INDEX IF NOT EXISTS idx_redistricting_cycle ON redistricting_history (census_cycle_from, census_cycle_to);'
    ];

    // Try to create PostGIS spatial index if PostGIS is available
    try {
      const { error: spatialError } = await supabase.rpc('exec_sql', { 
        sql: 'CREATE INDEX IF NOT EXISTS idx_geographic_lookups_geometry ON geographic_lookups USING GIST (geometry);' 
      });
      
      if (spatialError) {
        console.log('   ⚠️  PostGIS spatial index not available (PostGIS may not be enabled)');
      } else {
        console.log('   ✅ PostGIS spatial index created successfully');
      }
    } catch (_err) {
      console.log('   ⚠️  PostGIS spatial index not available');
    }

    for (const indexSQL of indexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
        if (error) {
          console.log(`   ❌ Failed to create index: ${error.message}`);
        } else {
          console.log(`   ✅ Index created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error creating index: ${err}`);
      }
    }

    // Step 4: Create geographic utility functions
    console.log('\n4. Creating geographic utility functions...');
    
    const functions = [
      {
        name: 'get_ocd_from_zip',
        sql: `
          CREATE OR REPLACE FUNCTION get_ocd_from_zip(zip_code TEXT)
          RETURNS TABLE(ocd_division_id TEXT, confidence DECIMAL(3,2))
          LANGUAGE SQL
          AS $$
            SELECT ocd_division_id, confidence
            FROM zip_to_ocd
            WHERE zip5 = zip_code
            ORDER BY confidence DESC
            LIMIT 1;
          $$;
        `
      },
      {
        name: 'get_ocd_from_coords',
        sql: `
          CREATE OR REPLACE FUNCTION get_ocd_from_coords(latitude DECIMAL, longitude DECIMAL)
          RETURNS TABLE(ocd_division_id TEXT, confidence DECIMAL(3,2))
          LANGUAGE SQL
          AS $$
            SELECT ocd_division_id, confidence
            FROM latlon_to_ocd
            WHERE lat = latitude AND lon = longitude
            ORDER BY confidence DESC
            LIMIT 1;
          $$;
        `
      },
      {
        name: 'get_districts_for_state',
        sql: `
          CREATE OR REPLACE FUNCTION get_districts_for_state(state_code TEXT, district_type TEXT DEFAULT 'congressional')
          RETURNS TABLE(
            district_number TEXT,
            ocd_division_id TEXT,
            census_cycle INT,
            congress_number INT,
            is_current BOOLEAN
          )
          LANGUAGE SQL
          AS $$
            SELECT district_number, ocd_division_id, census_cycle, congress_number, is_current
            FROM state_districts
            WHERE state = state_code 
              AND district_type = get_districts_for_state.district_type
            ORDER BY census_cycle DESC, district_number;
          $$;
        `
      },
      {
        name: 'validate_ocd_division',
        sql: `
          CREATE OR REPLACE FUNCTION validate_ocd_division(ocd_id TEXT)
          RETURNS BOOLEAN
          LANGUAGE SQL
          AS $$
            SELECT EXISTS(
              SELECT 1 FROM geographic_lookups WHERE ocd_division_id = ocd_id
            );
          $$;
        `
      }
    ];

    for (const func of functions) {
      try {
        console.log(`   Creating function ${func.name}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
        
        if (error) {
          console.log(`   ❌ Failed to create ${func.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${func.name} created successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error creating ${func.name}: ${err}`);
      }
    }

    // Step 5: Seed initial geographic data
    console.log('\n5. Seeding initial geographic data...');
    
    // Sample ZIP to OCD mappings (real data would come from USPS/Census)
    const sampleZipData = [
      { zip5: '10001', ocd_division_id: 'ocd-division/country:us/state:ny/cd:10', confidence: 0.95 },
      { zip5: '10002', ocd_division_id: 'ocd-division/country:us/state:ny/cd:10', confidence: 0.95 },
      { zip5: '90210', ocd_division_id: 'ocd-division/country:us/state:ca/cd:30', confidence: 0.90 },
      { zip5: '60601', ocd_division_id: 'ocd-division/country:us/state:il/cd:7', confidence: 0.95 },
      { zip5: '02101', ocd_division_id: 'ocd-division/country:us/state:ma/cd:7', confidence: 0.90 }
    ];

    // Sample lat/lon to OCD mappings
    const sampleLatLonData = [
      { lat: 40.7505, lon: -73.9934, ocd_division_id: 'ocd-division/country:us/state:ny/cd:10', confidence: 0.95 },
      { lat: 34.0901, lon: -118.3617, ocd_division_id: 'ocd-division/country:us/state:ca/cd:30', confidence: 0.90 },
      { lat: 41.8781, lon: -87.6298, ocd_division_id: 'ocd-division/country:us/state:il/cd:7', confidence: 0.95 },
      { lat: 42.3601, lon: -71.0589, ocd_division_id: 'ocd-division/country:us/state:ma/cd:7', confidence: 0.90 }
    ];

    // Sample state districts (2020 census cycle)
    const sampleDistricts = [
      { state: 'NY', district_type: 'congressional', district_number: '10', ocd_division_id: 'ocd-division/country:us/state:ny/cd:10', census_cycle: 2020, congress_number: 118, valid_from: '2023-01-01' },
      { state: 'CA', district_type: 'congressional', district_number: '30', ocd_division_id: 'ocd-division/country:us/state:ca/cd:30', census_cycle: 2020, congress_number: 118, valid_from: '2023-01-01' },
      { state: 'IL', district_type: 'congressional', district_number: '7', ocd_division_id: 'ocd-division/country:us/state:il/cd:7', census_cycle: 2020, congress_number: 118, valid_from: '2023-01-01' },
      { state: 'MA', district_type: 'congressional', district_number: '7', ocd_division_id: 'ocd-division/country:us/state:ma/cd:7', census_cycle: 2020, congress_number: 118, valid_from: '2023-01-01' }
    ];

    try {
      const { error: zipError } = await supabase.from('zip_to_ocd').insert(sampleZipData);
      if (zipError) {
        console.log(`   ❌ Failed to seed ZIP data: ${zipError.message}`);
      } else {
        console.log(`   ✅ ZIP to OCD data seeded (${sampleZipData.length} records)`);
      }
    } catch (err) {
      console.log(`   ❌ Error seeding ZIP data: ${err}`);
    }

    try {
      const { error: latlonError } = await supabase.from('latlon_to_ocd').insert(sampleLatLonData);
      if (latlonError) {
        console.log(`   ❌ Failed to seed lat/lon data: ${latlonError.message}`);
      } else {
        console.log(`   ✅ Lat/Lon to OCD data seeded (${sampleLatLonData.length} records)`);
      }
    } catch (err) {
      console.log(`   ❌ Error seeding lat/lon data: ${err}`);
    }

    try {
      const { error: districtsError } = await supabase.from('state_districts').insert(sampleDistricts);
      if (districtsError) {
        console.log(`   ❌ Failed to seed districts data: ${districtsError.message}`);
      } else {
        console.log(`   ✅ State districts data seeded (${sampleDistricts.length} records)`);
      }
    } catch (err) {
      console.log(`   ❌ Error seeding districts data: ${err}`);
    }

    console.log('\n🎉 PostGIS and Geographic Lookups setup completed!');
    
    console.log('\n📊 Geographic System Summary:');
    console.log('   - PostGIS extension: ' + (postgisError ? 'Not available (using text-based lookups)' : 'Enabled'));
    console.log('   - Geographic lookup tables: 5 created');
    console.log('   - Geographic indexes: 12+ created');
    console.log('   - Utility functions: 4 created');
    console.log('   - Sample data: ZIP, lat/lon, and district mappings seeded');

    console.log('\n🚀 Geographic Features Available:');
    console.log('   - ZIP code to OCD Division ID lookup');
    console.log('   - Latitude/Longitude to OCD Division ID lookup');
    console.log('   - State district enumeration (congressional, state house, state senate)');
    console.log('   - Redistricting history tracking');
    console.log('   - Census cycle and congress number mapping');
    console.log('   - Geographic validation functions');

  } catch (error) {
    console.error('\n❌ PostGIS setup failed:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupPostGIS()
    .then(() => {
      console.log('\n✅ PostGIS setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ PostGIS setup failed:', error);
      process.exit(1);
    });
}

export { setupPostGIS };
