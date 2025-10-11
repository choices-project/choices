#!/usr/bin/env node

/**
 * Script to query Supabase database directly to get current schema
 * This ensures our schema redesign is based on actual database structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryDatabaseSchema() {
  try {
    console.log('🔍 Querying Supabase database schema...\n');
    
    // Get all tables in public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error querying tables:', tablesError);
      return;
    }

    console.log('📊 Current Database Tables:');
    console.log('==========================');
    tables.forEach(table => {
      console.log(`- ${table.table_name} (${table.table_type})`);
    });

    // Get table columns for user-related tables
    const userTables = tables.filter(t => 
      t.table_name.includes('user') || 
      t.table_name.includes('profile') || 
      t.table_name.includes('poll') || 
      t.table_name.includes('vote') || 
      t.table_name.includes('consent') || 
      t.table_name.includes('privacy') || 
      t.table_name.includes('analytics') ||
      t.table_name.includes('error')
    );

    console.log('\n🔍 User-Centric Tables Analysis:');
    console.log('=================================');

    for (const table of userTables) {
      console.log(`\n📋 Table: ${table.table_name}`);
      console.log('-'.repeat(50));
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position');

      if (columnsError) {
        console.error(`Error querying columns for ${table.table_name}:`, columnsError);
        continue;
      }

      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });

      // Get row count
      const { count, error: countError } = await supabase
        .from(table.table_name)
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`  📊 Row count: ${count || 0}`);
      }
    }

    // Get indexes
    console.log('\n🔍 Database Indexes:');
    console.log('==================');
    
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .eq('schemaname', 'public')
      .order('tablename');

    if (!indexesError && indexes) {
      indexes.forEach(index => {
        console.log(`- ${index.tablename}.${index.indexname}`);
      });
    }

    // Get functions
    console.log('\n🔍 Database Functions:');
    console.log('=====================');
    
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('pronamespace', (await supabase.from('pg_namespace').select('oid').eq('nspname', 'public').single()).data?.oid);

    if (!functionsError && functions) {
      functions.forEach(func => {
        console.log(`- ${func.proname}`);
      });
    }

    console.log('\n✅ Schema analysis complete!');
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
}

// Run the query
queryDatabaseSchema();
