#!/usr/bin/env node

/**
 * Simple Database Schema Checker
 * 
 * Uses raw SQL to query the live database schema
 */

const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking live database schema...');
  
  const results = {
    tables: [],
    views: [],
    functions: [],
    sequences: [],
    errors: []
  };
  
  try {
    // 1. Get all tables using a simple query
    console.log('📋 Fetching tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            tableowner
          FROM pg_tables 
          WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
          ORDER BY schemaname, tablename;
        `
      });
    
    if (tablesError) {
      console.warn(`⚠️  Could not fetch tables: ${tablesError.message}`);
      results.errors.push(`Tables: ${tablesError.message}`);
    } else {
      results.tables = tables || [];
      console.log(`✅ Found ${results.tables.length} tables`);
    }
    
    // 2. Get all views
    console.log('👁️  Fetching views...');
    const { data: views, error: viewsError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            viewname,
            viewowner
          FROM pg_views 
          WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
          ORDER BY schemaname, viewname;
        `
      });
    
    if (viewsError) {
      console.warn(`⚠️  Could not fetch views: ${viewsError.message}`);
      results.errors.push(`Views: ${viewsError.message}`);
    } else {
      results.views = views || [];
      console.log(`✅ Found ${results.views.length} views`);
    }
    
    // 3. Get all functions
    console.log('🔧 Fetching functions...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_result(p.oid) as return_type,
            pg_get_function_arguments(p.oid) as arguments
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
          ORDER BY n.nspname, p.proname;
        `
      });
    
    if (functionsError) {
      console.warn(`⚠️  Could not fetch functions: ${functionsError.message}`);
      results.errors.push(`Functions: ${functionsError.message}`);
    } else {
      results.functions = functions || [];
      console.log(`✅ Found ${results.functions.length} functions`);
    }
    
    // 4. Get all sequences
    console.log('🔢 Fetching sequences...');
    const { data: sequences, error: sequencesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            sequencename,
            data_type,
            start_value,
            minimum_value,
            maximum_value,
            increment
          FROM pg_sequences 
          WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
          ORDER BY schemaname, sequencename;
        `
      });
    
    if (sequencesError) {
      console.warn(`⚠️  Could not fetch sequences: ${sequencesError.message}`);
      results.errors.push(`Sequences: ${sequencesError.message}`);
    } else {
      results.sequences = sequences || [];
      console.log(`✅ Found ${results.sequences.length} sequences`);
    }
    
    // 5. Try to get table columns for a few tables
    console.log('🔍 Fetching column details for sample tables...');
    const sampleTables = results.tables.slice(0, 5); // First 5 tables
    
    for (const table of sampleTables) {
      const { data: columns, error: columnsError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length,
              numeric_precision,
              numeric_scale
            FROM information_schema.columns
            WHERE table_schema = '${table.schemaname}' 
              AND table_name = '${table.tablename}'
            ORDER BY ordinal_position;
          `
        });
      
      if (columnsError) {
        console.warn(`⚠️  Could not fetch columns for ${table.schemaname}.${table.tablename}: ${columnsError.message}`);
      } else {
        table.columns = columns || [];
        console.log(`   ${table.schemaname}.${table.tablename}: ${table.columns.length} columns`);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    results.errors.push(`General: ${error.message}`);
    return results;
  }
}

async function main() {
  try {
    const results = await checkSchema();
    
    // Write results to file
    const outputPath = path.join(__dirname, '../LIVE_DATABASE_SCHEMA.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n📊 SCHEMA SUMMARY:');
    console.log(`   Tables: ${results.tables.length}`);
    console.log(`   Views: ${results.views.length}`);
    console.log(`   Functions: ${results.functions.length}`);
    console.log(`   Sequences: ${results.sequences.length}`);
    console.log(`   Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      results.errors.forEach(error => console.log(`   ${error}`));
    }
    
    console.log('\n📋 TABLES FOUND:');
    results.tables.forEach(table => {
      const columnCount = table.columns ? table.columns.length : '?';
      console.log(`   ${table.schemaname}.${table.tablename} (${columnCount} columns)`);
    });
    
    console.log('\n👁️  VIEWS FOUND:');
    results.views.forEach(view => {
      console.log(`   ${view.schemaname}.${view.viewname}`);
    });
    
    console.log('\n🔧 FUNCTIONS FOUND:');
    results.functions.forEach(func => {
      console.log(`   ${func.schema_name}.${func.function_name}(${func.arguments}) -> ${func.return_type}`);
    });
    
    console.log('\n🔢 SEQUENCES FOUND:');
    results.sequences.forEach(seq => {
      console.log(`   ${seq.schemaname}.${seq.sequencename} (${seq.data_type})`);
    });
    
    console.log(`\n✅ Schema information saved to: ${outputPath}`);
    
    // Also create a human-readable markdown version
    const markdownPath = path.join(__dirname, '../LIVE_DATABASE_SCHEMA.md');
    const markdown = generateMarkdownSchema(results);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📝 Human-readable schema saved to: ${markdownPath}`);
    
  } catch (error) {
    console.error('❌ Failed to check schema:', error.message);
    process.exit(1);
  }
}

function generateMarkdownSchema(results) {
  let markdown = `# Live Database Schema\n\n`;
  markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
  
  // Tables
  markdown += `## Tables (${results.tables.length})\n\n`;
  results.tables.forEach(table => {
    markdown += `### ${table.schemaname}.${table.tablename}\n\n`;
    markdown += `**Owner**: ${table.tableowner}\n\n`;
    
    if (table.columns && table.columns.length > 0) {
      markdown += `**Columns**:\n\n`;
      markdown += `| Column | Type | Nullable | Default |\n`;
      markdown += `|--------|------|----------|----------|\n`;
      
      table.columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
        const defaultVal = col.column_default || '-';
        markdown += `| ${col.column_name} | ${col.data_type} | ${nullable} | ${defaultVal} |\n`;
      });
      markdown += `\n`;
    }
  });
  
  // Views
  if (results.views.length > 0) {
    markdown += `## Views (${results.views.length})\n\n`;
    results.views.forEach(view => {
      markdown += `### ${view.schemaname}.${view.viewname}\n\n`;
      markdown += `**Owner**: ${view.viewowner}\n\n`;
    });
  }
  
  // Functions
  if (results.functions.length > 0) {
    markdown += `## Functions (${results.functions.length})\n\n`;
    results.functions.forEach(func => {
      markdown += `### ${func.schema_name}.${func.function_name}\n\n`;
      markdown += `**Arguments**: ${func.arguments}\n`;
      markdown += `**Return Type**: ${func.return_type}\n\n`;
    });
  }
  
  // Sequences
  if (results.sequences.length > 0) {
    markdown += `## Sequences (${results.sequences.length})\n\n`;
    results.sequences.forEach(seq => {
      markdown += `### ${seq.schemaname}.${seq.sequencename}\n\n`;
      markdown += `**Data Type**: ${seq.data_type}\n`;
      markdown += `**Start Value**: ${seq.start_value}\n`;
      markdown += `**Increment**: ${seq.increment}\n\n`;
    });
  }
  
  // Errors
  if (results.errors.length > 0) {
    markdown += `## Errors\n\n`;
    results.errors.forEach(error => {
      markdown += `- ${error}\n`;
    });
  }
  
  return markdown;
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkSchema };

