#!/usr/bin/env node

/**
 * Generate Complete Database Schema from Table List
 * 
 * This script uses the known table list to generate a complete TypeScript schema
 * by querying each table individually to get its column definitions.
 */

const path = require('path');
const fs = require('fs');

// Change to web directory to load environment variables
const webPath = path.join(__dirname, '..', 'web');
process.chdir(webPath);

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function generateCompleteSchema() {
  console.log('🔍 Generating complete schema from table list...');
  
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

    // Load the table list
    const tableListPath = path.join(__dirname, '..', 'web', 'types', 'all-tables-discovery.json');
    const tableData = JSON.parse(fs.readFileSync(tableListPath, 'utf8'));
    
    const allTables = [
      ...tableData.accessible,
      ...tableData.withData,
      ...tableData.inaccessible
    ];
    
    console.log(`📋 Found ${allTables.length} tables to process`);

    // Generate schema for each table
    const tablesMap = {};
    let processedCount = 0;
    
    for (const tableName of allTables) {
      try {
        console.log(`🔍 Processing table: ${tableName} (${processedCount + 1}/${allTables.length})`);
        
        // Try to get a sample row to infer column types
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (sampleError) {
          console.log(`  ⚠️  Could not access ${tableName}: ${sampleError.message}`);
          // Create a generic schema for inaccessible tables
          tablesMap[tableName] = [{
            name: 'id',
            type: 'uuid',
            nullable: false,
            default: null,
            maxLength: null,
            precision: null,
            scale: null,
            udtName: 'uuid'
          }];
          processedCount++;
          continue;
        }
        
        if (sampleData && sampleData.length > 0) {
          // Infer column types from sample data
          const sampleRow = sampleData[0];
          const columns = Object.entries(sampleRow).map(([key, value]) => {
            let type = 'unknown';
            let nullable = value === null;
            
            if (typeof value === 'string') {
              type = 'text';
            } else if (typeof value === 'number') {
              type = 'integer';
            } else if (typeof value === 'boolean') {
              type = 'boolean';
            } else if (value instanceof Date) {
              type = 'timestamp with time zone';
            } else if (typeof value === 'object' && value !== null) {
              type = 'jsonb';
            }
            
            return {
              name: key,
              type: type,
              nullable: nullable,
              default: null,
              maxLength: null,
              precision: null,
              scale: null,
              udtName: type
            };
          });
          
          tablesMap[tableName] = columns;
          console.log(`  ✅ ${tableName}: ${columns.length} columns (from sample data)`);
        } else {
          // Empty table - create generic schema
          tablesMap[tableName] = [{
            name: 'id',
            type: 'uuid',
            nullable: false,
            default: null,
            maxLength: null,
            precision: null,
            scale: null,
            udtName: 'uuid'
          }];
          console.log(`  📝 ${tableName}: Generic schema (empty table)`);
        }
        
        processedCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  ❌ Error processing ${tableName}: ${error.message}`);
        // Create a generic schema for error cases
        tablesMap[tableName] = [{
          name: 'id',
          type: 'uuid',
          nullable: false,
          default: null,
          maxLength: null,
          precision: null,
          scale: null,
          udtName: 'uuid'
        }];
        processedCount++;
      }
    }

    console.log(`\n📊 Processed ${processedCount} tables`);

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
    
    console.log(`\n✅ Complete schema written to: ${outputPath}`);
    console.log(`📊 Generated schema for ${Object.keys(tablesMap).length} tables`);
    
    // Show sample of first few tables
    console.log('\n📋 Sample tables:');
    const tableNames = Object.keys(tablesMap);
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
generateCompleteSchema();
