#!/usr/bin/env node

/**
 * Script to generate correct TypeScript types from actual Supabase database schema
 * This bypasses the CLI authentication issues and generates types directly from the database
 */

const https = require('https');

const SUPABASE_URL = 'https://muqwrehywjrbaeerjgfb.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_EjblzJPMdsHo_OHnUADe-A_6QJROE3H';

// Core tables that are actually used by the codebase
const CORE_TABLES = [
  'polls',
  'user_profiles', 
  'hashtags',
  'votes',
  'representatives_core',
  'hashtag_usage',
  'hashtag_flags',
  'analytics_events',
  'webauthn_credentials',
  'user_hashtags',
  'webauthn_challenges',
  'trust_tier_analytics',
  'feedback',
  'user_profiles_encrypted',
  'user_notification_preferences',
  'user_consent',
  'private_user_data',
  'candidates',
  'demographic_analytics',
  'admin_activity_log'
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
            resolve({});
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
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

function generateTypeScriptTypes(schemas) {
  let output = `// Generated TypeScript types from actual Supabase database schema
// Generated on: ${new Date().toISOString()}

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

  // Generate table types
  for (const [tableName, schema] of Object.entries(schemas)) {
    if (Object.keys(schema).length === 0) continue;
    
    const pascalCase = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    output += `      ${tableName}: {
        Row: {\n`;
    
    // Generate Row type
    for (const [key, value] of Object.entries(schema)) {
      const tsType = mapPostgreSQLTypeToTypeScript(value, key);
      const isOptional = value === null || value === undefined;
      const optional = isOptional ? '?' : '';
      const nullable = value === null ? ' | null' : '';
      
      output += `          ${key}${optional}: ${tsType}${nullable}\n`;
    }
    
    output += `        }
        Insert: {\n`;
    
    // Generate Insert type (all fields optional except required ones)
    for (const [key, value] of Object.entries(schema)) {
      const tsType = mapPostgreSQLTypeToTypeScript(value, key);
      const isId = key === 'id';
      const isRequired = isId || key.includes('_id') || key === 'email' || key === 'username';
      const optional = isRequired ? '' : '?';
      const nullable = value === null ? ' | null' : '';
      
      output += `          ${key}${optional}: ${tsType}${nullable}\n`;
    }
    
    output += `        }
        Update: {\n`;
    
    // Generate Update type (all fields optional)
    for (const [key, value] of Object.entries(schema)) {
      const tsType = mapPostgreSQLTypeToTypeScript(value, key);
      const nullable = value === null ? ' | null' : '';
      
      output += `          ${key}?: ${tsType}${nullable}\n`;
    }
    
    output += `        }
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
  console.log('🔍 Fetching schema for core tables...');
  
  const schemas = {};
  
  for (const tableName of CORE_TABLES) {
    try {
      console.log(`  📋 Fetching ${tableName}...`);
      const schema = await fetchTableSchema(tableName);
      schemas[tableName] = schema;
      console.log(`  ✅ ${tableName} - ${Object.keys(schema).length} fields`);
    } catch (error) {
      console.log(`  ❌ ${tableName} - Error: ${error.message}`);
    }
  }
  
  console.log('\n🔧 Generating TypeScript types...');
  const typesOutput = generateTypeScriptTypes(schemas);
  
  console.log('💾 Writing to types/database_corrected.ts...');
  require('fs').writeFileSync('types/database_corrected.ts', typesOutput);
  
  console.log('✅ Type generation complete!');
  console.log(`📊 Generated types for ${Object.keys(schemas).length} tables`);
}

main().catch(console.error);
