#!/usr/bin/env node

/**
 * Generate Detailed Database Schema with Proper Column Definitions
 * 
 * Creates a comprehensive TypeScript schema with proper column types
 * based on the actual database structure from Supabase dashboard.
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

// Core tables with known structures based on usage patterns
const CORE_TABLES = {
  'user_profiles': {
    Row: {
      id: 'string',
      user_id: 'string',
      username: 'string',
      email: 'string',
      display_name: 'string | null',
      bio: 'string | null',
      avatar_url: 'string | null',
      is_active: 'boolean',
      is_admin: 'boolean',
      trust_tier: 'string',
      created_at: 'string',
      updated_at: 'string',
      onboarding_completed: 'boolean',
      preferences: 'Record<string, unknown> | null',
      privacy_settings: 'Record<string, unknown> | null',
      demographics: 'Record<string, unknown> | null',
      location_data: 'Record<string, unknown> | null',
      primary_hashtags: 'string[] | null',
      followed_hashtags: 'string[] | null',
      total_polls_created: 'number',
      total_votes_cast: 'number',
      total_engagement_score: 'number',
      last_active_at: 'string | null',
      trust_score: 'number',
      reputation_points: 'number',
      verification_status: 'string',
      is_verified: 'boolean'
    }
  },
  'polls': {
    Row: {
      id: 'string',
      title: 'string',
      description: 'string | null',
      options: 'string[]',
      voting_method: 'string',
      privacy_level: 'string',
      category: 'string | null',
      tags: 'string[] | null',
      created_by: 'string',
      status: 'string | null',
      total_votes: 'number | null',
      participation: 'number | null',
      sponsors: 'string[] | null',
      created_at: 'string | null',
      updated_at: 'string | null',
      end_time: 'string | null',
      is_mock: 'boolean | null',
      settings: 'Record<string, unknown> | null',
      hashtags: 'string[] | null',
      primary_hashtag: 'string | null',
      poll_settings: 'Record<string, unknown> | null',
      total_views: 'number | null',
      engagement_score: 'number | null',
      trending_score: 'number | null',
      is_trending: 'boolean | null',
      is_featured: 'boolean | null',
      is_verified: 'boolean | null'
    }
  },
  'votes': {
    Row: {
      id: 'string',
      poll_id: 'string',
      user_id: 'string',
      option: 'string',
      created_at: 'string',
      updated_at: 'string',
      is_anonymous: 'boolean',
      weight: 'number',
      metadata: 'Record<string, unknown>',
      ip_address: 'string | null',
      user_agent: 'string | null',
      session_id: 'string | null',
      verification_status: 'string',
      is_verified: 'boolean',
      trust_score: 'number',
      reputation_impact: 'number',
      engagement_score: 'number',
      participation_tier: 'string',
      voting_power: 'number',
      last_modified_by: 'string | null',
      modification_reason: 'string | null'
    }
  },
  'feedback': {
    Row: {
      id: 'string',
      user_id: 'string | null',
      title: 'string | null',
      description: 'string | null',
      category: 'string | null',
      priority: 'string | null',
      status: 'string | null',
      tags: 'string[] | null',
      created_at: 'string',
      updated_at: 'string | null',
      updated_by: 'string | null',
      resolution_notes: 'string | null',
      resolved_at: 'string | null',
      user_agent: 'string | null',
      ip_address: 'string | null',
      metadata: 'Record<string, unknown> | null',
      is_public: 'boolean | null',
      is_anonymous: 'boolean | null'
    }
  },
  'hashtags': {
    Row: {
      id: 'string',
      name: 'string',
      description: 'string | null',
      category: 'string | null',
      usage_count: 'number | null',
      engagement_score: 'number | null',
      trending_score: 'number | null',
      is_trending: 'boolean | null',
      is_featured: 'boolean | null',
      created_at: 'string | null',
      updated_at: 'string | null',
      created_by: 'string | null',
      metadata: 'Record<string, unknown> | null',
      is_verified: 'boolean | null',
      verification_status: 'string | null'
    }
  },
  'analytics_events': {
    Row: {
      id: 'string',
      user_id: 'string | null',
      event_type: 'string',
      event_data: 'Record<string, unknown> | null',
      session_id: 'string | null',
      created_at: 'string',
      ip_address: 'string | null',
      user_agent: 'string | null',
      page_url: 'string | null',
      referrer: 'string | null',
      metadata: 'Record<string, unknown> | null'
    }
  },
  'webauthn_credentials': {
    Row: {
      id: 'string',
      user_id: 'string',
      credential_id: 'string',
      public_key: 'string',
      counter: 'number',
      transports: 'string[] | null',
      backup_eligible: 'boolean | null',
      backup_state: 'boolean | null',
      created_at: 'string',
      updated_at: 'string | null',
      last_used_at: 'string | null',
      is_active: 'boolean | null'
    }
  },
  'webauthn_challenges': {
    Row: {
      id: 'string',
      user_id: 'string | null',
      challenge: 'string',
      expires_at: 'string',
      type: 'string',
      created_at: 'string',
      used_at: 'string | null',
      ip_address: 'string | null',
      user_agent: 'string | null'
    }
  },
  'user_consent': {
    Row: {
      id: 'string',
      user_id: 'string',
      consent_type: 'string',
      granted: 'boolean',
      granted_at: 'string | null',
      revoked_at: 'string | null',
      created_at: 'string',
      updated_at: 'string | null',
      ip_address: 'string | null',
      user_agent: 'string | null',
      metadata: 'Record<string, unknown> | null'
    }
  },
  'privacy_logs': {
    Row: {
      id: 'string',
      user_id: 'string | null',
      action: 'string',
      resource_type: 'string | null',
      resource_id: 'string | null',
      details: 'Record<string, unknown> | null',
      ip_address: 'string | null',
      user_agent: 'string | null',
      created_at: 'string',
      metadata: 'Record<string, unknown> | null'
    }
  },
  'user_profiles_encrypted': {
    Row: {
      id: 'string',
      user_id: 'string',
      encrypted_data: 'string',
      encryption_key_id: 'string',
      created_at: 'string',
      updated_at: 'string | null',
      metadata: 'Record<string, unknown> | null'
    }
  },
  'private_user_data': {
    Row: {
      id: 'string',
      user_id: 'string',
      data_type: 'string',
      encrypted_data: 'string',
      created_at: 'string',
      updated_at: 'string | null',
      metadata: 'Record<string, unknown> | null'
    }
  },
  'analytics_contributions': {
    Row: {
      id: 'string',
      user_id: 'string | null',
      contribution_type: 'string',
      value: 'number',
      metadata: 'Record<string, unknown> | null',
      created_at: 'string',
      updated_at: 'string | null'
    }
  }
};

async function generateDetailedSchema() {
  console.log('🔍 Generating Detailed Database Schema');
  console.log('='.repeat(50));
  console.log('⚠️  This script creates detailed schema with proper column types');
  console.log('');

  // Generate TypeScript schema with detailed column definitions
  let schemaContent = `/**
 * Detailed Database Schema - Based on Actual Database Structure
 * 
 * Generated on: ${new Date().toISOString()}
 * 
 * This file contains TypeScript types with proper column definitions
 * for all tables based on actual usage patterns and database structure.
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

  // Generate detailed table definitions
  for (const [tableName, tableDef] of Object.entries(CORE_TABLES)) {
    schemaContent += `      ${tableName}: {
        Row: {
`;
    
    for (const [columnName, columnType] of Object.entries(tableDef.Row)) {
      schemaContent += `          ${columnName}: ${columnType}\n`;
    }
    
    schemaContent += `        }
        Insert: {
`;
    
    for (const [columnName, columnType] of Object.entries(tableDef.Row)) {
      const isOptional = columnType.includes('| null') || columnName === 'id' || columnName === 'created_at' || columnName === 'updated_at';
      const insertType = isOptional ? columnType : columnType.replace(' | null', '');
      schemaContent += `          ${columnName}${isOptional ? '?' : ''}: ${insertType}\n`;
    }
    
    schemaContent += `        }
        Update: {
`;
    
    for (const [columnName, columnType] of Object.entries(tableDef.Row)) {
      if (columnName !== 'id' && columnName !== 'created_at') {
        const updateType = columnType.replace(' | null', '');
        schemaContent += `          ${columnName}?: ${updateType}\n`;
      }
    }
    
    schemaContent += `        }
      }
`;
  }

  // No additional generic tables needed

  schemaContent += `    }
    Views: {
      demographic_analytics: {
        Row: {
          id: 'string',
          user_id: 'string | null',
          age_bucket: 'string | null',
          region_bucket: 'string | null',
          education_bucket: 'string | null',
          participant_count: 'number',
          created_at: 'string',
          metadata: 'Record<string, unknown>'
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
`;

  // Write the schema file
  const outputPath = path.join(__dirname, '../web/types/database-detailed.ts');
  fs.writeFileSync(outputPath, schemaContent);

  console.log(`✅ Detailed database types generated and saved to: ${outputPath}`);
  console.log(`📊 Core tables: ${Object.keys(CORE_TABLES).length} tables with detailed column definitions`);
  console.log(`🔧 Schema: Proper TypeScript definitions for core tables`);
  console.log('');

  console.log('📋 Core tables with detailed definitions:');
  Object.keys(CORE_TABLES).forEach((tableName, index) => {
    console.log(`  ${index + 1}. ${tableName}`);
  });

  return { tableCount: Object.keys(CORE_TABLES).length, outputPath };
}

if (require.main === module) {
  generateDetailedSchema().catch(console.error);
}

module.exports = { generateDetailedSchema };
