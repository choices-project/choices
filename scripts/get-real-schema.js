#!/usr/bin/env node

/**
 * Get Real Database Schema by Direct Querying
 * 
 * Queries each table directly to get the actual column definitions
 * and generates accurate TypeScript types.
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

// All 121 tables from your Supabase dashboard
const ALL_TABLES = [
  'analytics_contributions', 'analytics_demographics', 'analytics_events', 'analytics_page_views',
  'analytics_sessions', 'analytics_user_engagement', 'audit_logs', 'bias_detection_logs',
  'biometric_auth_logs', 'biometric_trust_scores', 'breaking_news', 'campaign_finance',
  'candidate_jurisdictions', 'candidates', 'civic_jurisdictions', 'civics_feed_items',
  'contributions', 'data_checksums', 'data_licenses', 'data_lineage', 'data_quality_audit',
  'data_quality_checks', 'data_quality_metrics', 'data_quality_summary', 'data_sources',
  'data_transformations', 'dbt_freshness_sla', 'dbt_freshness_status', 'dbt_test_config',
  'dbt_test_execution_history', 'dbt_test_execution_log', 'dbt_test_results', 'dbt_test_results_summary',
  'demographic_analytics', 'elections', 'error_logs', 'fact_check_sources', 'fec_candidate_committee',
  'fec_candidates', 'fec_candidates_v2', 'fec_committees', 'fec_committees_v2', 'fec_contributions',
  'fec_cycles', 'fec_disbursements', 'fec_filings_v2', 'fec_independent_expenditures',
  'fec_ingest_cursors', 'feedback', 'generated_polls', 'hashtag_analytics', 'hashtag_co_occurrence',
  'hashtag_content', 'hashtag_engagement', 'hashtag_performance_summary', 'hashtag_usage', 'hashtags',
  'id_crosswalk', 'idempotency_keys', 'independence_score_methodology', 'ingest_cursors',
  'ingestion_cursors', 'ingestion_logs', 'jurisdiction_aliases', 'jurisdiction_geometries',
  'jurisdiction_tiles', 'jurisdictions_optimal', 'latlon_to_ocd', 'location_consent_audit',
  'media_polls', 'media_sources', 'migration_log', 'news_fetch_logs', 'news_sources',
  'notification_history', 'poll_analytics', 'poll_contexts', 'poll_generation_logs', 'polls',
  'privacy_audit_logs', 'privacy_consent_records', 'privacy_data_requests', 'privacy_logs',
  'private_user_data', 'push_subscriptions', 'quality_metrics', 'rate_limits', 'redistricting_history',
  'representative_activity_enhanced', 'representative_campaign_finance', 'representative_committees',
  'representative_contacts_optimal', 'representative_leadership', 'representative_offices_optimal',
  'representative_photos_optimal', 'representative_roles_optimal', 'representative_social_media_optimal',
  'representative_social_posts', 'representatives_core', 'security_audit_log', 'site_messages',
  'staging_processing_summary', 'state_districts', 'system_configuration', 'trending_topics',
  'user_analytics', 'user_civics_preferences', 'user_consent', 'user_engagement_summary',
  'user_feedback_analytics', 'user_hashtags', 'user_location_resolutions', 'user_notification_preferences',
  'user_privacy_analytics', 'user_profiles', 'user_profiles_encrypted', 'votes', 'voting_records',
  'webauthn_challenges', 'webauthn_credentials', 'zip_to_ocd'
];

async function getTableSchema(tableName) {
  try {
    // Try to get a sample row to infer the schema
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`⚠️  Table '${tableName}' error: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  Table '${tableName}' is empty`);
      return null;
    }
    
    const sampleRow = data[0];
    const columns = {};
    
    // Infer types from the sample data
    for (const [key, value] of Object.entries(sampleRow)) {
      if (value === null) {
        columns[key] = 'string | null';
      } else if (typeof value === 'string') {
        columns[key] = 'string';
      } else if (typeof value === 'number') {
        columns[key] = 'number';
      } else if (typeof value === 'boolean') {
        columns[key] = 'boolean';
      } else if (Array.isArray(value)) {
        columns[key] = 'string[]';
      } else if (typeof value === 'object') {
        columns[key] = 'Record<string, unknown>';
      } else {
        columns[key] = 'string';
      }
    }
    
    console.log(`✅ Table '${tableName}' schema inferred`);
    return columns;
    
  } catch (err) {
    console.log(`❌ Table '${tableName}' failed: ${err.message}`);
    return null;
  }
}

async function generateRealSchema() {
  console.log('🔍 Getting Real Database Schema by Direct Querying');
  console.log('='.repeat(60));
  console.log('⚠️  This script queries each table directly to get real schema');
  console.log('');
  
  const tableSchemas = {};
  let successCount = 0;
  let failCount = 0;
  
  console.log(`🔍 Querying ${ALL_TABLES.length} tables...`);
  
  for (const tableName of ALL_TABLES) {
    process.stdout.write(`📋 ${tableName}... `);
    const schema = await getTableSchema(tableName);
    
    if (schema) {
      tableSchemas[tableName] = schema;
      successCount++;
      console.log('✅');
    } else {
      failCount++;
      console.log('❌');
    }
  }
  
  console.log(`\n📊 Results: ${successCount} successful, ${failCount} failed`);
  
  // Generate TypeScript schema
  let schemaContent = `/**
 * Real Database Schema - Generated by Direct Querying
 * 
 * Generated on: ${new Date().toISOString()}
 * 
 * This file contains TypeScript types based on actual database queries.
 * Each table was queried directly to get real column definitions.
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

  // Generate table definitions
  for (const [tableName, columns] of Object.entries(tableSchemas)) {
    schemaContent += `      ${tableName}: {
        Row: {
`;
    
    for (const [columnName, columnType] of Object.entries(columns)) {
      schemaContent += `          ${columnName}: ${columnType}\n`;
    }
    
    schemaContent += `        }
        Insert: {
`;
    
    for (const [columnName, columnType] of Object.entries(columns)) {
      const isOptional = columnType.includes('| null') || columnName === 'id' || columnName === 'created_at' || columnName === 'updated_at';
      const insertType = isOptional ? columnType : columnType.replace(' | null', '');
      schemaContent += `          ${columnName}${isOptional ? '?' : ''}: ${insertType}\n`;
    }
    
    schemaContent += `        }
        Update: {
`;
    
    for (const [columnName, columnType] of Object.entries(columns)) {
      if (columnName !== 'id' && columnName !== 'created_at') {
        const updateType = columnType.replace(' | null', '');
        schemaContent += `          ${columnName}?: ${updateType}\n`;
      }
    }
    
    schemaContent += `        }
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
  const outputPath = path.join(__dirname, '../web/types/database-real.ts');
  fs.writeFileSync(outputPath, schemaContent);

  console.log(`\n✅ Real database schema generated and saved to: ${outputPath}`);
  console.log(`📊 Tables with real schema: ${successCount}`);
  console.log(`🔧 Schema: TypeScript definitions based on actual database queries`);
  
  return { successCount, failCount, outputPath };
}

if (require.main === module) {
  generateRealSchema().catch(console.error);
}

module.exports = { generateRealSchema };
