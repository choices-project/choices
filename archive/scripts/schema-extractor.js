#!/usr/bin/env node

/**
 * Simple Database Schema Extractor
 * 
 * Uses existing Supabase client to extract live database schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function extractSchema() {
  console.log('🔍 Extracting live database schema...');
  
  const schema = {
    tables: {},
    views: {},
    functions: {},
    sequences: {},
    indexes: {},
    constraints: {},
    rls_policies: {}
  };
  
  try {
    // 1. Get all tables using information_schema
    console.log('📋 Fetching tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name, table_type')
      .not('table_schema', 'in', '(pg_catalog,information_schema,pg_toast,pg_temp_1,pg_toast_temp_1)')
      .order('table_schema')
      .order('table_name');
    
    if (tablesError) {
      throw new Error(`Failed to fetch tables: ${tablesError.message}`);
    }
    
    console.log(`✅ Found ${tables.length} tables/views`);
    
    // 2. For each table, get detailed information
    for (const table of tables) {
      const schemaName = table.table_schema;
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
      const tableInfo = {
        type: table.table_type,
        columns: columns || [],
        constraints: constraints || [],
        indexes: indexes || [],
        policies: policies || []
      };
      
      if (table.table_type === 'VIEW') {
        schema.views[fullName] = tableInfo;
      } else {
        schema.tables[fullName] = tableInfo;
      }
    }
    
    // 3. Get functions
    console.log('🔧 Fetching functions...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_type', 'FUNCTION')
      .not('routine_schema', 'in', '(pg_catalog,information_schema)');
    
    if (functionsError) {
      console.warn(`⚠️  Could not fetch functions: ${functionsError.message}`);
    } else {
      functions?.forEach(func => {
        const fullName = `${func.routine_schema}.${func.routine_name}`;
        schema.functions[fullName] = func;
      });
    }
    
    // 4. Get sequences
    console.log('🔢 Fetching sequences...');
    const { data: sequences, error: sequencesError } = await supabase
      .from('information_schema.sequences')
      .select('*')
      .not('sequence_schema', 'in', '(pg_catalog,information_schema)');
    
    if (sequencesError) {
      console.warn(`⚠️  Could not fetch sequences: ${sequencesError.message}`);
    } else {
      sequences?.forEach(seq => {
        const fullName = `${seq.sequence_schema}.${seq.sequence_name}`;
        schema.sequences[fullName] = seq;
      });
    }
    
    return schema;
    
  } catch (error) {
    console.error('❌ Error extracting schema:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const schema = await extractSchema();
    
    // Write schema to file
    const outputPath = path.join(__dirname, '../LIVE_DATABASE_SCHEMA.json');
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    
    console.log('\n📊 SCHEMA SUMMARY:');
    console.log(`   Tables: ${Object.keys(schema.tables).length}`);
    console.log(`   Views: ${Object.keys(schema.views).length}`);
    console.log(`   Functions: ${Object.keys(schema.functions).length}`);
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
    
    // Also create a human-readable markdown version
    const markdownPath = path.join(__dirname, '../LIVE_DATABASE_SCHEMA.md');
    const markdown = generateMarkdownSchema(schema);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📝 Human-readable schema saved to: ${markdownPath}`);
    
  } catch (error) {
    console.error('❌ Failed to extract schema:', error.message);
    process.exit(1);
  }
}

function generateMarkdownSchema(schema) {
  let markdown = `# Live Database Schema\n\n`;
  markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
  
  // Tables
  markdown += `## Tables (${Object.keys(schema.tables).length})\n\n`;
  Object.entries(schema.tables).forEach(([tableName, tableInfo]) => {
    markdown += `### ${tableName}\n\n`;
    markdown += `**Type**: ${tableInfo.type}\n\n`;
    
    if (tableInfo.columns.length > 0) {
      markdown += `**Columns**:\n\n`;
      markdown += `| Column | Type | Nullable | Default | Identity |\n`;
      markdown += `|--------|------|----------|---------|----------|\n`;
      
      tableInfo.columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
        const identity = col.is_identity === 'YES' ? '✅' : '❌';
        const defaultVal = col.column_default || '-';
        markdown += `| ${col.column_name} | ${col.data_type} | ${nullable} | ${defaultVal} | ${identity} |\n`;
      });
      markdown += `\n`;
    }
    
    if (tableInfo.constraints.length > 0) {
      markdown += `**Constraints**:\n\n`;
      tableInfo.constraints.forEach(constraint => {
        markdown += `- ${constraint.constraint_type}: ${constraint.constraint_name}\n`;
      });
      markdown += `\n`;
    }
    
    if (tableInfo.indexes.length > 0) {
      markdown += `**Indexes**:\n\n`;
      tableInfo.indexes.forEach(index => {
        markdown += `- ${index.indexname}: ${index.indexdef}\n`;
      });
      markdown += `\n`;
    }
    
    if (tableInfo.policies.length > 0) {
      markdown += `**RLS Policies**:\n\n`;
      tableInfo.policies.forEach(policy => {
        markdown += `- ${policy.policyname}: ${policy.cmd} (${policy.roles?.join(', ') || 'all'})\n`;
      });
      markdown += `\n`;
    }
  });
  
  // Views
  if (Object.keys(schema.views).length > 0) {
    markdown += `## Views (${Object.keys(schema.views).length})\n\n`;
    Object.entries(schema.views).forEach(([viewName, viewInfo]) => {
      markdown += `### ${viewName}\n\n`;
      if (viewInfo.columns.length > 0) {
        markdown += `**Columns**:\n\n`;
        markdown += `| Column | Type |\n`;
        markdown += `|--------|------|\n`;
        viewInfo.columns.forEach(col => {
          markdown += `| ${col.column_name} | ${col.data_type} |\n`;
        });
        markdown += `\n`;
      }
    });
  }
  
  // Functions
  if (Object.keys(schema.functions).length > 0) {
    markdown += `## Functions (${Object.keys(schema.functions).length})\n\n`;
    Object.entries(schema.functions).forEach(([funcName, funcInfo]) => {
      markdown += `### ${funcName}\n\n`;
      markdown += `**Return Type**: ${funcInfo.data_type}\n\n`;
      if (funcInfo.routine_definition) {
        markdown += `**Definition**:\n\`\`\`sql\n${funcInfo.routine_definition}\n\`\`\`\n\n`;
      }
    });
  }
  
  // Sequences
  if (Object.keys(schema.sequences).length > 0) {
    markdown += `## Sequences (${Object.keys(schema.sequences).length})\n\n`;
    Object.entries(schema.sequences).forEach(([seqName, seqInfo]) => {
      markdown += `### ${seqName}\n\n`;
      markdown += `**Data Type**: ${seqInfo.data_type}\n`;
      markdown += `**Start Value**: ${seqInfo.start_value}\n`;
      markdown += `**Increment**: ${seqInfo.increment}\n\n`;
    });
  }
  
  return markdown;
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { extractSchema };

