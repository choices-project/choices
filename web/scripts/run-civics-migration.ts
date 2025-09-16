#!/usr/bin/env tsx

/**
 * Run Civics Data Migration
 * 
 * Applies the civics data ingestion migration to the database
 * Run this to set up the canonical ID system and civics tables
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running Civics Data Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'database/migrations/003_civics_id_crosswalk.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log(`   File: ${migrationPath}`);
    console.log(`   Size: ${migrationSQL.length} characters\n`);

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }

      try {
        console.log(`   ${i + 1}/${statements.length}: Executing statement...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`   ❌ Error executing statement ${i + 1}:`, error.message);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
        
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
        
      } catch (error) {
        console.error(`   ❌ Failed to execute statement ${i + 1}:`, error);
        throw error;
      }
    }

    console.log('\n🎉 Migration completed successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'id_crosswalk',
        'candidates',
        'elections',
        'campaign_finance',
        'contributions',
        'voting_records',
        'data_licenses',
        'independence_score_methodology',
        'ingest_cursors',
        'data_quality_audit'
      ]);

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError.message);
    } else {
      console.log(`   ✅ Found ${tables?.length || 0} civics tables created`);
      tables?.forEach(table => {
        console.log(`      - ${table.table_name}`);
      });
    }

    // Check for extensions
    const { data: extensions, error: extensionsError } = await supabase
      .from('pg_extension')
      .select('extname')
      .in('extname', ['uuid-ossp', 'pgcrypto']);

    if (extensionsError) {
      console.error('❌ Error verifying extensions:', extensionsError.message);
    } else {
      console.log(`   ✅ Found ${extensions?.length || 0} required extensions`);
      extensions?.forEach(ext => {
        console.log(`      - ${ext.extname}`);
      });
    }

    console.log('\n📊 Migration Summary:');
    console.log('   - Canonical ID crosswalk system created');
    console.log('   - Civics data tables created with proper constraints');
    console.log('   - Row Level Security policies enabled');
    console.log('   - Initial data licenses and methodology seeded');
    console.log('   - Utility functions created');
    console.log('   - Indexes created for optimal performance');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Run the test script: npm run test:canonical-ids');
    console.log('   2. Set up PostGIS extension for geographic lookups');
    console.log('   3. Implement FEC pipeline with cycles and cursors');
    console.log('   4. Add staging tables for raw data storage');
    console.log('   5. Set up dbt tests for data quality');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };
