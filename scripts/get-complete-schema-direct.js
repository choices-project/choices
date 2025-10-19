#!/usr/bin/env node

/**
 * Get Complete Database Schema for ALL Tables
 * 
 * This script uses the existing database connection from the web app
 * to get the complete column definitions for ALL tables.
 */

const path = require('path');
const fs = require('fs');

// Add the web directory to the module path so we can import from it
const webPath = path.join(__dirname, '..', 'web');
require('module')._resolveFilename = (function(originalResolveFilename) {
  return function(request, parent, isMain) {
    if (request.startsWith('@/') || request.startsWith('./') || request.startsWith('../')) {
      return originalResolveFilename(request, parent, isMain);
    }
    try {
      return originalResolveFilename(request, parent, isMain);
    } catch (err) {
      // Try resolving from web directory
      const webRequest = path.join(webPath, request);
      try {
        return originalResolveFilename(webRequest, parent, isMain);
      } catch (err2) {
        throw err;
      }
    }
  };
})(require('module')._resolveFilename);

// Change to web directory to load environment variables
process.chdir(webPath);

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function getCompleteSchema() {
  console.log('🔍 Getting complete schema for ALL tables...');
  
  try {
    // Import the Supabase client from the web app
    const { createClient } = require('@supabase/supabase-js');
    
    // Get environment variables
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
      console.error('Current env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, let's get all table names
    const { data: tablesList, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('❌ Error getting tables list:', tablesError);
      return;
    }

    console.log(`📋 Found ${tablesList.length} tables`);

    // Now get column information for each table
    const tablesData = [];
    for (const table of tablesList) {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', table.table_name)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (columnsError) {
        console.error(`❌ Error getting columns for ${table.table_name}:`, columnsError);
        continue;
      }

      // Add table name to each column
      columns.forEach(col => {
        tablesData.push({
          table_name: table.table_name,
          column_name: col.column_name,
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default,
          character_maximum_length: col.character_maximum_length,
          numeric_precision: col.numeric_precision,
          numeric_scale: col.numeric_scale,
          udt_name: col.udt_name,
          final_type: col.data_type === 'ARRAY' ? col.udt_name : col.data_type
        });
      });
    }

    console.log(`📊 Found ${tablesData.length} column definitions`);

    // Group by table
    const tablesMap = {};
    tablesData.forEach(row => {
      if (!tablesMap[row.table_name]) {
        tablesMap[row.table_name] = [];
      }
      if (row.column_name) {
        tablesMap[row.table_name].push({
          name: row.column_name,
          type: row.final_type,
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
          maxLength: row.character_maximum_length,
          precision: row.numeric_precision,
          scale: row.numeric_scale,
          udtName: row.udt_name
        });
      }
    });

    const tableNames = Object.keys(tablesMap);
    console.log(`📋 Found ${tableNames.length} tables:`);
    tableNames.forEach(name => {
      const columnCount = tablesMap[name].length;
      console.log(`  - ${name}: ${columnCount} columns`);
    });

    // Generate TypeScript schema
    const generateTypeScriptSchema = (tables) => {
      const tableTypes = Object.entries(tables).map(([tableName, columns]) => {
        const columnTypes = columns.map(col => {
          let tsType = 'unknown';
          
          // Map PostgreSQL types to TypeScript
          switch (col.type) {
            case 'uuid':
              tsType = 'string';
              break;
            case 'text':
            case 'varchar':
            case 'character varying':
              tsType = 'string';
              break;
            case 'integer':
            case 'bigint':
            case 'smallint':
              tsType = 'number';
              break;
            case 'boolean':
              tsType = 'boolean';
              break;
            case 'timestamp with time zone':
            case 'timestamp without time zone':
            case 'date':
              tsType = 'string';
              break;
            case 'json':
            case 'jsonb':
              tsType = 'Json';
              break;
            case 'numeric':
            case 'decimal':
              tsType = 'number';
              break;
            case 'ARRAY':
              // Handle array types
              if (col.udtName && col.udtName.includes('text')) {
                tsType = 'string[]';
              } else {
                tsType = 'unknown[]';
              }
              break;
            default:
              tsType = 'unknown';
          }

          const nullable = col.nullable ? ' | null' : '';
          return `    ${col.name}: ${tsType}${nullable}`;
        }).join('\n');

        return `  ${tableName}: {
    Row: {
${columnTypes}
    }
    Insert: {
${columnTypes}
    }
    Update: {
${columnTypes}
    }
  }`;
      }).join('\n');

      return `export type Database = {
  public: {
    Tables: {
${tableTypes}
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]`;
    };

    const tsSchema = generateTypeScriptSchema(tablesMap);
    
    // Write to file
    const outputPath = path.join(__dirname, '..', 'web', 'types', 'database-complete.ts');
    
    fs.writeFileSync(outputPath, tsSchema);
    
    console.log(`✅ Complete schema written to: ${outputPath}`);
    console.log(`📊 Generated schema for ${tableNames.length} tables with full column definitions`);
    
    // Show sample of first few tables
    console.log('\n📋 Sample tables:');
    tableNames.slice(0, 5).forEach(name => {
      const columns = tablesMap[name];
      console.log(`  ${name}:`);
      columns.slice(0, 3).forEach(col => {
        console.log(`    - ${col.name}: ${col.type}${col.nullable ? ' (nullable)' : ''}`);
      });
      if (columns.length > 3) {
        console.log(`    ... and ${columns.length - 3} more columns`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
getCompleteSchema();
