#!/usr/bin/env node

/**
 * Get Complete Database Schema for ALL Tables using SQL
 * 
 * This script uses the admin client to execute SQL queries directly
 * to get the complete column definitions for ALL tables.
 */

const path = require('path');
const fs = require('fs');

// Change to web directory to load environment variables
const webPath = path.join(__dirname, '..', 'web');
process.chdir(webPath);

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function getCompleteSchema() {
  console.log('🔍 Getting complete schema for ALL tables using SQL...');
  
  try {
    // Import the Supabase client from the web app
    const { createClient } = require('@supabase/supabase-js');
    
    // Get environment variables
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use SQL to get all table and column information
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            t.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.udt_name,
            CASE 
              WHEN c.data_type = 'ARRAY' THEN c.udt_name
              ELSE c.data_type
            END as final_type
          FROM information_schema.tables t
          LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
          WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
          ORDER BY t.table_name, c.ordinal_position;
        `
      });

    if (tablesError) {
      console.error('❌ Error getting table schema:', tablesError);
      return;
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
