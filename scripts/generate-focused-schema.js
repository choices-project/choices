#!/usr/bin/env node

/**
 * Generate Focused Database Schema
 * 
 * Creates a focused schema with only the core tables that actually exist
 * and have data in the database.
 * 
 * SAFETY: Read-only operations only
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables safely
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Only the core tables that actually exist and have data
const CORE_TABLES = [
  'user_profiles',
  'polls', 
  'votes',
  'feedback',
  'hashtags',
  'analytics_events'
];

async function sampleTableData(tableName) {
  try {
    console.log(`📋 Sampling ${tableName}...`);
    
    // Get a sample record to understand the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`⚠️  Error sampling ${tableName}:`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      const sample = data[0];
      const fields = {};
      
      Object.keys(sample).forEach(field => {
        const value = sample[field];
        let type = 'unknown';
        
        if (value === null) {
          type = 'null';
        } else if (typeof value === 'string') {
          type = 'string';
        } else if (typeof value === 'number') {
          type = 'number';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            type = 'array';
          } else {
            type = 'object';
          }
        }
        
        fields[field] = {
          type,
          nullable: value === null,
          sampleValue: value
        };
      });
      
      console.log(`✅ ${tableName}: ${Object.keys(fields).length} fields`);
      return fields;
    } else {
      console.log(`📝 No data in ${tableName}, but table exists`);
      return {};
    }
  } catch (error) {
    console.log(`❌ Error sampling ${tableName}:`, error.message);
    return null;
  }
}

function generateTypeScriptType(fieldName, fieldInfo) {
  let tsType = 'unknown';
  
  switch (fieldInfo.type) {
    case 'string':
      tsType = 'string';
      break;
    case 'number':
      tsType = 'number';
      break;
    case 'boolean':
      tsType = 'boolean';
      break;
    case 'array':
      tsType = 'string[]';
      break;
    case 'object':
      tsType = 'Record<string, unknown>';
      break;
    case 'null':
      tsType = 'null';
      break;
    default:
      tsType = 'unknown';
  }
  
  if (fieldInfo.nullable && fieldInfo.type !== 'null') {
    tsType += ' | null';
  }
  
  return tsType;
}

async function generateFocusedTypes() {
  console.log('🔍 Generating Focused Database Schema');
  console.log('='.repeat(50));
  console.log('⚠️  This script performs READ-ONLY operations only');
  console.log(`📊 Testing ${CORE_TABLES.length} core tables...`);
  console.log('');

  const tableStructures = {};
  
  for (const tableName of CORE_TABLES) {
    const structure = await sampleTableData(tableName);
    if (structure) {
      tableStructures[tableName] = structure;
    }
  }

  console.log(`\n📊 Summary: ${Object.keys(tableStructures).length} tables with data`);

  // Generate TypeScript schema
  let schemaContent = `/**
 * Focused Database Schema - Core Tables Only
 * 
 * Generated on: ${new Date().toISOString()}
 * 
 * This file contains TypeScript types for the core tables that actually exist
 * and have data in the database.
 * 
 * Tables: ${Object.keys(tableStructures).join(', ')}
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
`;

  for (const [tableName, structure] of Object.entries(tableStructures)) {
    schemaContent += `      ${tableName}: {
        Row: {
`;
    
    for (const [fieldName, fieldInfo] of Object.entries(structure)) {
      const tsType = generateTypeScriptType(fieldName, fieldInfo);
      schemaContent += `          ${fieldName}: ${tsType}\n`;
    }
    
    schemaContent += `        }
        Insert: {
`;
    
    // For Insert, make most fields optional except required ones
    for (const [fieldName, fieldInfo] of Object.entries(structure)) {
      const tsType = generateTypeScriptType(fieldName, fieldInfo);
      const isOptional = fieldName === 'id' || fieldName === 'created_at' || fieldName === 'updated_at';
      schemaContent += `          ${fieldName}${isOptional ? '?' : ''}: ${tsType}\n`;
    }
    
    schemaContent += `        }
        Update: {
`;
    
    // For Update, make all fields optional
    for (const [fieldName, fieldInfo] of Object.entries(structure)) {
      const tsType = generateTypeScriptType(fieldName, fieldInfo);
      schemaContent += `          ${fieldName}?: ${tsType}\n`;
    }
    
    schemaContent += `        }
        Relationships: [
`;
    
    // Add relationships (empty for now)
    schemaContent += `        ]
      }
`;
  }

  schemaContent += `    }
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
`;

  // Write the schema file
  const outputPath = path.join(__dirname, '../web/types/database-focused.ts');
  fs.writeFileSync(outputPath, schemaContent);
  
  console.log(`\n✅ Focused database types generated and saved to: ${outputPath}`);
  console.log(`📊 Tables processed: ${Object.keys(tableStructures).length}`);
  
  for (const [tableName, structure] of Object.entries(tableStructures)) {
    console.log(`  - ${tableName}: ${Object.keys(structure).length} fields`);
  }
}

if (require.main === module) {
  generateFocusedTypes().catch(console.error);
}

module.exports = { generateFocusedTypes };
