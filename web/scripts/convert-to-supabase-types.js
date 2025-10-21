#!/usr/bin/env node

/**
 * Convert individual interfaces from db-types.ts to proper Supabase Database type structure
 */

const fs = require('fs');

// Read the db-types.ts file
const dbTypesContent = fs.readFileSync('types/db-types.ts', 'utf8');

// Extract all interface names and their content
const interfaceRegex = /export interface (\w+) \{([^}]+)\}/g;
const interfaces = {};
let match;

while ((match = interfaceRegex.exec(dbTypesContent)) !== null) {
  const interfaceName = match[1];
  const interfaceBody = match[2];
  interfaces[interfaceName] = interfaceBody;
}

// Core tables that are actually used
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

// Convert interface name to table name (PascalCase to snake_case)
function interfaceToTableName(interfaceName) {
  return interfaceName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

// Convert table name to interface name (snake_case to PascalCase)
function tableNameToInterfaceName(tableName) {
  return tableName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Generate Supabase Database type structure
function generateSupabaseDatabaseType() {
  let output = `// Generated Supabase Database type from db-types.ts
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

  // Generate table types for core tables
  for (const tableName of CORE_TABLES) {
    const interfaceName = tableNameToInterfaceName(tableName);
    
    if (interfaces[interfaceName]) {
      output += `      ${tableName}: {
        Row: ${interfaceName}
        Insert: Partial<${interfaceName}>
        Update: Partial<${interfaceName}>
        Relationships: []
      }
`;
    }
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

// Generate the output
const supabaseTypes = generateSupabaseDatabaseType();

// Write to file
fs.writeFileSync('types/database_fixed.ts', supabaseTypes);

console.log('✅ Converted db-types.ts to Supabase Database type structure');
console.log(`📊 Generated types for ${CORE_TABLES.length} core tables`);
console.log('💾 Written to types/database_fixed.ts');
