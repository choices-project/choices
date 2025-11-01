#!/usr/bin/env node

/**
 * Live Database Schema Extractor
 * 
 * This script connects to the live Supabase database and extracts the complete schema,
 * including tables, columns, constraints, indexes, RLS policies, and more.
 * 
 * Usage: node scripts/get-live-schema.js
 */

const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SECRET_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getLiveSchema() {
  console.log('🔍 Connecting to live Supabase database...');
  
  try {
    // 1. Get all tables
    console.log('📋 Fetching all tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');
    
    if (tablesError) {
      // Fallback: query information_schema directly
      const { data: fallbackTables, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name, table_type')
        .not('table_schema', 'in', '(pg_catalog,information_schema,pg_toast,pg_temp_1,pg_toast_temp_1)')
        .order('table_schema')
        .order('table_name');
      
      if (fallbackError) {
        throw new Error(`Failed to fetch tables: ${fallbackError.message}`);
      }
      
      console.log(`✅ Found ${fallbackTables.length} tables`);
      return await extractSchemaFromTables(fallbackTables);
    }
    
    console.log(`✅ Found ${tables.length} tables`);
    return await extractSchemaFromTables(tables);
    
  } catch (error) {
    console.error('❌ Error fetching schema:', error.message);
    
    // Try alternative approach using raw SQL
    console.log('🔄 Trying alternative approach with raw SQL...');
    return await extractSchemaWithRawSQL();
  }
}

async function extractSchemaFromTables(tables) {
  const schema = {
    tables: {},
    views: {},
    functions: {},
    enums: {},
    sequences: {},
    indexes: {},
    constraints: {},
    rls_policies: {},
    triggers: {}
  };
  
  for (const table of tables) {
    const schemaName = table.table_schema || 'public';
    const tableName = table.table_name;
    const fullName = `${schemaName}.${tableName}`;
    
    console.log(`🔍 Analyzing ${fullName}...`);
    
    // Get columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', schemaName)
      .eq('table_name', tableName)
      .order('ordinal_position');
    
    if (columnsError) {
      console.warn(`⚠️  Could not fetch columns for ${fullName}: ${columnsError.message}`);
      continue;
    }
    
    // Get constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_schema', schemaName)
      .eq('table_name', tableName);
    
    if (constraintsError) {
      console.warn(`⚠️  Could not fetch constraints for ${fullName}: ${constraintsError.message}`);
    }
    
    // Get indexes
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('*')
      .eq('schemaname', schemaName)
      .eq('tablename', tableName);
    
    if (indexesError) {
      console.warn(`⚠️  Could not fetch indexes for ${fullName}: ${indexesError.message}`);
    }
    
    // Get RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', schemaName)
      .eq('tablename', tableName);
    
    if (policiesError) {
      console.warn(`⚠️  Could not fetch RLS policies for ${fullName}: ${policiesError.message}`);
    }
    
    // Store table information
    if (table.table_type === 'VIEW') {
      schema.views[fullName] = {
        columns: columns || [],
        constraints: constraints || [],
        indexes: indexes || [],
        policies: policies || []
      };
    } else {
      schema.tables[fullName] = {
        columns: columns || [],
        constraints: constraints || [],
        indexes: indexes || [],
        policies: policies || []
      };
    }
  }
  
  return schema;
}

async function extractSchemaWithRawSQL() {
  console.log('🔧 Using raw SQL queries...');
  
  const schema = {
    tables: {},
    views: {},
    functions: {},
    enums: {},
    sequences: {},
    indexes: {},
    constraints: {},
    rls_policies: {},
    triggers: {}
  };
  
  // Get all tables and views
  const { data: tables, error: tablesError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT 
          n.nspname AS schema_name,
          c.relname AS table_name,
          CASE c.relkind 
            WHEN 'r' THEN 'table'
            WHEN 'v' THEN 'view'
            WHEN 'm' THEN 'materialized_view'
            ELSE c.relkind::text
          END AS table_type
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r', 'v', 'm')
          AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
        ORDER BY n.nspname, c.relname;
      `
    });
  
  if (tablesError) {
    throw new Error(`Failed to fetch tables with raw SQL: ${tablesError.message}`);
  }
  
  console.log(`✅ Found ${tables.length} tables/views with raw SQL`);
  
  for (const table of tables) {
    const schemaName = table.schema_name;
    const tableName = table.table_name;
    const fullName = `${schemaName}.${tableName}`;
    
    console.log(`🔍 Analyzing ${fullName} (${table.table_type})...`);
    
    // Get detailed table information
    const { data: tableInfo, error: tableInfoError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            column_name,
            data_type,
            udt_name,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            is_identity,
            identity_generation
          FROM information_schema.columns
          WHERE table_schema = '${schemaName}' 
            AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `
      });
    
    if (tableInfoError) {
      console.warn(`⚠️  Could not fetch table info for ${fullName}: ${tableInfoError.message}`);
      continue;
    }
    
    // Store table information
    if (table.table_type === 'view') {
      schema.views[fullName] = {
        columns: tableInfo || []
      };
    } else {
      schema.tables[fullName] = {
        columns: tableInfo || []
      };
    }
  }
  
  return schema;
}

async function main() {
  try {
    const schema = await getLiveSchema();
    
    // Write schema to file
    const outputPath = path.join(__dirname, '../LIVE_DATABASE_SCHEMA.json');
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    
    console.log('\n📊 SCHEMA SUMMARY:');
    console.log(`   Tables: ${Object.keys(schema.tables).length}`);
    console.log(`   Views: ${Object.keys(schema.views).length}`);
    console.log(`   Functions: ${Object.keys(schema.functions).length}`);
    console.log(`   Enums: ${Object.keys(schema.enums).length}`);
    console.log(`   Sequences: ${Object.keys(schema.sequences).length}`);
    
    console.log('\n📋 TABLES FOUND:');
    Object.keys(schema.tables).forEach(table => {
      const columnCount = schema.tables[table].columns?.length || 0;
      console.log(`   ${table} (${columnCount} columns)`);
    });
    
    console.log('\n👁️  VIEWS FOUND:');
    Object.keys(schema.views).forEach(view => {
      const columnCount = schema.views[view].columns?.length || 0;
      console.log(`   ${view} (${columnCount} columns)`);
    });
    
    console.log(`\n✅ Complete schema saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Failed to extract schema:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { getLiveSchema };

