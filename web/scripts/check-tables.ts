#!/usr/bin/env tsx

/**
 * Check Tables Script
 * 
 * Simple script to check if civics tables exist and create them if needed
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

async function checkTables() {
  console.log('🔍 Checking if civics tables exist...\n');

  try {
    // Check if id_crosswalk table exists
    const { data, error } = await supabase
      .from('id_crosswalk')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ id_crosswalk table does not exist or has issues:');
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
      console.log(`   Hint: ${error.hint}`);
      
      // Try to create the table manually
      console.log('\n🔧 Attempting to create id_crosswalk table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS id_crosswalk (
          entity_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type TEXT NOT NULL CHECK (entity_type IN ('person','committee','bill','jurisdiction','election')),
          canonical_id TEXT NOT NULL,
          source TEXT NOT NULL,
          source_id TEXT NOT NULL,
          attrs JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (source, source_id)
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.log('❌ Failed to create table:', createError.message);
      } else {
        console.log('✅ id_crosswalk table created successfully');
      }
    } else {
      console.log('✅ id_crosswalk table exists and is accessible');
      console.log(`   Found ${data.length || 0} records`);
    }

    // Check other tables
    const tables = ['candidates', 'elections', 'campaign_finance', 'contributions', 'voting_records'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table} table: ${error.message}`);
        } else {
          console.log(`✅ ${table} table: accessible (${data.length || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table} table: ${err}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

// Run the check
if (require.main === module) {
  checkTables()
    .then(() => {
      console.log('\n✅ Table check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Table check failed:', error);
      process.exit(1);
    });
}

export { checkTables };
