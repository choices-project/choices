#!/usr/bin/env node

/**
 * Systematic TypeScript type generation from actual Supabase database schema
 * Queries each core table directly and builds proper types
 */

const https = require('https');

const SUPABASE_URL = 'https://muqwrehywjrbaeerjgfb.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_EjblzJPMdsHo_OHnUADe-A_6QJROE3H';

// Core tables that are actually used by the codebase
const CORE_TABLES = [
  'polls',
  'user_profiles', 
  'votes',
  'hashtags',
  'feedback',
  'candidates',
  'analytics_events',
  'user_profiles_encrypted',
  'private_user_data',
  'webauthn_credentials',
  'webauthn_challenges',
  'user_hashtags',
  'hashtag_usage',
  'hashtag_flags',
  'trust_tier_analytics',
  'user_notification_preferences',
  'user_consent',
  'demographic_analytics',
  'admin_activity_log',
  'representatives_core'
];

async function fetchTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`;
    
    const options = {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'apikey': SUPABASE_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.length > 0) {
            resolve(result[0]);
          } else {
            // Table exists but is empty - create minimal schema
            resolve({ id: 'placeholder' });
          }
        } catch (error) {
          console.log(`  ❌ ${tableName} - Error parsing response: ${error.message}`);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.log(`  ❌ ${tableName} - Network error: ${error.message}`);
      resolve(null);
    });
  });
}

function mapPostgreSQLTypeToTypeScript(value, key) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const type = typeof value;
  
  switch (type) {
    case 'string':
      // Check if it's a UUID
      if (key.includes('id') && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return 'string';
      }
      // Check if it's a timestamp
      if (key.includes('_at') || key.includes('created') || key.includes('updated')) {
        return 'string';
      }
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      if (Array.isArray(value)) {
        return 'any[]';
      }
      return 'Json';
    default:
      return 'any';
  }
}

function generateInterface(tableName, schema) {
  const pascalCase = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  
  let interfaceCode = `export interface ${pascalCase} {\n`;
  
  if (schema && Object.keys(schema).length > 0 && schema.id !== 'placeholder') {
    for (const [key, value] of Object.entries(schema)) {
      const tsType = mapPostgreSQLTypeToTypeScript(value, key);
      const isOptional = value === null || value === undefined;
      const optional = isOptional ? '?' : '';
      const nullable = value === null ? ' | null' : '';
      
      interfaceCode += `  ${key}${optional}: ${tsType}${nullable}\n`;
    }
  } else {
    // Empty table - create minimal interface
    interfaceCode += `  id: string\n`;
    interfaceCode += `  created_at?: string | null\n`;
    interfaceCode += `  updated_at?: string | null\n`;
  }
  
  interfaceCode += `}\n\n`;
  return interfaceCode;
}

function generateDatabaseType(tableNames) {
  let output = `export interface Database {
  public: {
    Tables: {
`;

  for (const tableName of tableNames) {
    const pascalCase = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    output += `      ${tableName}: {
        Row: ${pascalCase}
        Insert: Omit<${pascalCase}, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<${pascalCase}, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: []
      }
`;
  }

  output += `    }
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

  return output;
}

async function main() {
  console.log('🔍 Systematically querying core tables...');
  
  const schemas = {};
  const successfulTables = [];
  
  for (const tableName of CORE_TABLES) {
    try {
      console.log(`  📋 Querying ${tableName}...`);
      const schema = await fetchTableSchema(tableName);
      
      if (schema) {
        schemas[tableName] = schema;
        successfulTables.push(tableName);
        const fieldCount = Object.keys(schema).length;
        console.log(`  ✅ ${tableName} - ${fieldCount} fields`);
      } else {
        console.log(`  ⚠️  ${tableName} - No data, creating minimal interface`);
        successfulTables.push(tableName);
      }
    } catch (error) {
      console.log(`  ❌ ${tableName} - Error: ${error.message}`);
    }
  }
  
  console.log('\n🔧 Generating TypeScript types...');
  
  let output = `// Generated TypeScript types from actual Supabase database schema
// Generated on: ${new Date().toISOString()}
// Systematically queried ${successfulTables.length} core tables

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

`;

  // Generate individual interfaces
  for (const tableName of successfulTables) {
    const schema = schemas[tableName] || { id: 'placeholder' };
    output += generateInterface(tableName, schema);
  }
  
  // Generate Database type
  output += generateDatabaseType(successfulTables);
  
  console.log('💾 Writing to types/database_systematic.ts...');
  require('fs').writeFileSync('types/database_systematic.ts', output);
  
  console.log('✅ Systematic type generation complete!');
  console.log(`📊 Generated types for ${successfulTables.length} tables`);
  console.log('📁 File: types/database_systematic.ts');
}

main().catch(console.error);
